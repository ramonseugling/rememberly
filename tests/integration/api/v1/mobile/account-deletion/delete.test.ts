import crypto from 'crypto';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import accountDeletion from 'models/account-deletion';
import group from 'models/group';
import password from 'models/password';
import session from 'models/session';

const url = 'http://localhost:3000/api/v1/mobile/me';
const secret = ' current-password ';
async function setup(withPassword = true) {
  const user = await orchestrator.createUser();
  if (withPassword)
    await database.query('UPDATE users SET password=$1 WHERE id=$2', [
      await password.hash(secret),
      user.id,
    ]);
  const current = await orchestrator.createSessionForUser(user.id);
  await database.query('UPDATE sessions SET expires_at=NULL WHERE id=$1', [
    current.id,
  ]);
  const finite = await orchestrator.createSessionForUser(user.id);
  return { user, current, finite };
}
let own: Awaited<ReturnType<typeof setup>>;
beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  own = await setup();
});
async function request(options: RequestInit = {}, target = url) {
  const response = await fetch(target, {
    method: 'DELETE',
    body: JSON.stringify({ password: secret, confirmation: 'DELETE' }),
    ...options,
    headers: {
      Authorization: `Bearer ${own.current.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('set-cookie')).toBeNull();
  return response;
}
async function exists(id: string) {
  return (await database.query('SELECT * FROM users WHERE id=$1', [id])).rows;
}

test('wrong passwords and passwordless accounts return403 without changing current sessions', async () => {
  for (const value of ['wrong', secret.trim()]) {
    const response = await request({
      body: JSON.stringify({ password: value, confirmation: 'DELETE' }),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      name: 'ForbiddenError',
      message: 'Unable to confirm your current password.',
      action: 'Confirm your current password and try again.',
      status_code: 403,
    });
  }
  const googleOnly = await setup(false);
  expect(
    (
      await request({
        headers: { Authorization: `Bearer ${googleOnly.current.token}` },
      })
    ).status,
  ).toBe(403);
  expect(await exists(googleOnly.user.id)).toHaveLength(1);
  expect(await session.findOneValidByToken(own.current.token)).not.toBeNull();
});

test.each([
  '',
  'Basic invalid',
  'Bearer short',
  `Bearer ${'A'.repeat(96)}`,
  `Bearer ${'f'.repeat(96)}`,
  `Bearer ${'a'.repeat(96)}, Bearer ${'b'.repeat(96)}`,
])('strict Bearer denial %# ignores valid cookies', async (Authorization) => {
  const response = await request({
    headers: { Authorization, Cookie: `session_token=${own.current.token}` },
  });
  expect(response.status).toBe(401);
  expect(response.headers.get('www-authenticate')).toBe(
    'Bearer realm="rememberly"',
  );
  expect(await exists(own.user.id)).toHaveLength(1);
});

test('cookies alone and expired/revoked tokens cannot delete accounts', async () => {
  expect(
    (
      await fetch(url, {
        method: 'DELETE',
        headers: { Cookie: `session_token=${own.current.token}` },
      })
    ).status,
  ).toBe(401);
  const expired = await setup();
  await session.expireByToken(expired.current.token);
  expect(
    (
      await request({
        headers: { Authorization: `Bearer ${expired.current.token}` },
      })
    ).status,
  ).toBe(401);
  expect(await exists(expired.user.id)).toHaveLength(1);
});

test.each([
  '{',
  'null',
  '{}',
  JSON.stringify({ password: secret }),
  JSON.stringify({ password: '', confirmation: 'DELETE' }),
  JSON.stringify({ password: secret, confirmation: 'delete' }),
  JSON.stringify({
    password: secret,
    confirmation: 'DELETE',
    user_id: crypto.randomUUID(),
  }),
  'x'.repeat(17000),
])('invalid deletion body %# cannot delete', async (body) => {
  expect((await request({ body })).status).toBe(400);
  expect(await exists(own.user.id)).toHaveLength(1);
});

test('query parameters and non-JSON content types are rejected', async () => {
  expect((await request({}, `${url}?user_id=${own.user.id}`)).status).toBe(400);
  expect(
    (await request({ headers: { 'Content-Type': 'text/plain' } })).status,
  ).toBe(400);
});

test('owned groups block deletion until explicitly deleted, preserving members and data', async () => {
  const subject = await setup();
  const owned = await group.create(subject.user.id, {
    name: 'Preserve this group',
  });
  await database.query(
    "INSERT INTO group_members(group_id,user_id,role) VALUES($1,$2,'member')",
    [owned.id, own.user.id],
  );
  const response = await request({
    headers: { Authorization: `Bearer ${subject.current.token}` },
  });
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({
    name: 'ConflictError',
    message: 'Account deletion is blocked while you own groups.',
    action: 'Delete the groups you own before deleting your account.',
    status_code: 409,
  });
  expect(await exists(subject.user.id)).toHaveLength(1);
  expect(
    (
      await database.query('SELECT * FROM group_members WHERE group_id=$1', [
        owned.id,
      ])
    ).rows,
  ).toHaveLength(2);
  expect(
    await session.findOneValidByToken(subject.current.token),
  ).not.toBeNull();
  await database.query('DELETE FROM groups WHERE id=$1', [owned.id]);
  expect(
    (
      await request({
        headers: { Authorization: `Bearer ${subject.current.token}` },
      })
    ).status,
  ).toBe(204);
});

test('database failure rolls back OTP, logs, personal data and all sessions', async () => {
  const event = await orchestrator.createEvent(own.user.id);
  await database.query(
    "INSERT INTO error_logs(error_name,message,user_id) VALUES('Test','rollback',$1)",
    [own.user.id],
  );
  await database.query(
    "INSERT INTO otp_tokens(email,code,expires_at) VALUES($1,'123456',NOW()+INTERVAL '1 hour')",
    [own.user.email],
  );
  await database.query(
    "CREATE FUNCTION reject_account_deletion() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test rollback'; END $$",
  );
  await database.query(
    'CREATE TRIGGER reject_account_deletion BEFORE DELETE ON users FOR EACH ROW EXECUTE FUNCTION reject_account_deletion()',
  );
  try {
    const response = await request();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      name: 'InternalServerError',
      message: 'An unexpected error occurred.',
      action: 'Try again later.',
      status_code: 500,
    });
    expect(await exists(own.user.id)).toHaveLength(1);
    expect(
      (await database.query('SELECT id FROM events WHERE id=$1', [event.id]))
        .rows,
    ).toHaveLength(1);
    expect(
      (
        await database.query(
          "SELECT id FROM error_logs WHERE user_id=$1 AND message='rollback'",
          [own.user.id],
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await database.query('SELECT id FROM otp_tokens WHERE email=$1', [
          own.user.email,
        ])
      ).rows,
    ).toHaveLength(1);
    expect(await session.findOneValidByToken(own.current.token)).not.toBeNull();
    expect(await session.findOneValidByToken(own.finite.token)).not.toBeNull();
  } finally {
    await database.query('DROP TRIGGER reject_account_deletion ON users');
    await database.query('DROP FUNCTION reject_account_deletion()');
  }
});

test.each(['revocation', 'password change', 'group creation'])(
  'revalidates %s committed while waiting for the user lock',
  async (change) => {
    const subject = await setup();
    const blocker = await database.getNewClient();
    let deletion: Promise<unknown> | undefined;
    try {
      await blocker.query('BEGIN');
      await blocker.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [
        subject.user.id,
      ]);
      // Catch immediately so a failed assertion cannot leave an unhandled rejection.
      deletion = accountDeletion
        .deleteAccount(subject.current.token, secret)
        .then(
          () => null,
          (error: unknown) => error,
        );
      let waiting = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        const activity = await database.query(
          `SELECT pid FROM pg_stat_activity WHERE wait_event_type='Lock'
           AND query='SELECT id, email, password FROM users WHERE id = $1 FOR UPDATE'`,
        );
        if (activity.rows.length) {
          waiting = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(waiting).toBe(true);
      if (change === 'revocation')
        await blocker.query('DELETE FROM sessions WHERE id=$1', [
          subject.current.id,
        ]);
      else if (change === 'password change')
        await blocker.query('UPDATE users SET password=$1 WHERE id=$2', [
          await password.hash('new password'),
          subject.user.id,
        ]);
      else
        await blocker.query(
          "INSERT INTO groups(name,invite_code,created_by) VALUES('Concurrent group',$1,$2)",
          [crypto.randomBytes(6).toString('hex'), subject.user.id],
        );
      await blocker.query('COMMIT');
      const error = await deletion;
      expect(error).toMatchObject({
        status_code:
          change === 'revocation'
            ? 401
            : change === 'password change'
              ? 403
              : 409,
      });
      expect(await exists(subject.user.id)).toHaveLength(1);
    } finally {
      await blocker.query('ROLLBACK');
      await blocker.end();
      if (deletion) await deletion;
    }
  },
);

test('deletes personal data atomically, preserves other users/groups and removes every current-account session', async () => {
  const another = await setup();
  const otherBefore = await exists(another.user.id);
  const shared = await group.create(another.user.id, {
    name: 'Another account owns this',
  });
  await database.query(
    "INSERT INTO group_members(group_id,user_id,role) VALUES($1,$2,'member')",
    [shared.id, own.user.id],
  );
  await orchestrator.createEvent(own.user.id);
  await orchestrator.createEvent(another.user.id);
  await database.query(
    "INSERT INTO password_reset_tokens(token,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '1 hour')",
    [crypto.randomBytes(48).toString('hex'), own.user.id],
  );
  await database.query(
    "INSERT INTO commemorative_subscriptions(user_id,date_key) VALUES($1,'christmas')",
    [own.user.id],
  );
  await database.query(
    "INSERT INTO broadcast_deliveries(user_id,announcement_key) VALUES($1,'sample')",
    [own.user.id],
  );
  await database.query(
    "INSERT INTO error_logs(error_name,message,user_id) VALUES('Test','owned',$1),('Test','other',$2),('Test','unattributed',NULL)",
    [own.user.id, another.user.id],
  );
  await database.query(
    "INSERT INTO otp_tokens(email,code,expires_at) VALUES($1,'123456',NOW()),($2,'123456',NOW())",
    [own.user.email.toUpperCase(), another.user.email],
  );
  await database.query(
    'INSERT INTO push_preferences(user_id,push_enabled) VALUES($1,true)',
    [own.user.id],
  );
  const device = await database.query(
    "INSERT INTO push_devices(installation_id,expo_push_token,user_id,session_id,platform) VALUES($1,$2,$3,$4,'ios') RETURNING id",
    [
      crypto.randomUUID(),
      'ExponentPushToken[account-deletion-test]',
      own.user.id,
      own.current.id,
    ],
  );
  const delivery = await database.query(
    "INSERT INTO push_deliveries(device_id,user_id,session_id,dedup_key,data) VALUES($1,$2,$3,'test','{}') RETURNING id",
    [device.rows[0].id, own.user.id, own.current.id],
  );
  await database.query(
    'INSERT INTO push_attempts(delivery_id,attempt) VALUES($1,1)',
    [delivery.rows[0].id],
  );
  const response = await request({
    headers: { Cookie: `session_token=${another.current.token}` },
  });
  expect(response.status).toBe(204);
  expect(await response.text()).toBe('');
  expect(await exists(own.user.id)).toEqual([]);
  expect(
    (
      await database.query(
        'SELECT id FROM push_attempts WHERE delivery_id=$1',
        [delivery.rows[0].id],
      )
    ).rows,
  ).toEqual([]);
  for (const table of [
    'sessions',
    'events',
    'group_members',
    'password_reset_tokens',
    'commemorative_subscriptions',
    'broadcast_deliveries',
    'error_logs',
    'push_preferences',
    'push_devices',
    'push_deliveries',
  ])
    expect(
      (
        await database.query(`SELECT * FROM ${table} WHERE user_id=$1`, [
          own.user.id,
        ])
      ).rows,
    ).toEqual([]);
  expect(
    (
      await database.query(
        'SELECT * FROM otp_tokens WHERE LOWER(email)=LOWER($1)',
        [own.user.email],
      )
    ).rows,
  ).toEqual([]);
  expect(
    (
      await database.query('SELECT id FROM otp_tokens WHERE email=$1', [
        another.user.email,
      ])
    ).rows,
  ).toHaveLength(1);
  expect(await exists(another.user.id)).toEqual(otherBefore);
  expect(
    (await database.query('SELECT id FROM groups WHERE id=$1', [shared.id]))
      .rows,
  ).toHaveLength(1);
  expect(
    (
      await database.query('SELECT id FROM group_members WHERE group_id=$1', [
        shared.id,
      ])
    ).rows,
  ).toHaveLength(1);
  expect(
    (
      await database.query('SELECT id FROM events WHERE user_id=$1', [
        another.user.id,
      ])
    ).rows,
  ).toHaveLength(1);
  expect(
    (
      await database.query(
        "SELECT id FROM error_logs WHERE message IN ('other','unattributed')",
      )
    ).rows,
  ).toHaveLength(2);
  expect(
    await session.findOneValidByToken(another.current.token),
  ).not.toBeNull();
  expect(await session.findOneValidByToken(own.current.token)).toBeNull();
  expect(await session.findOneValidByToken(own.finite.token)).toBeNull();
  expect((await request()).status).toBe(401);
  expect(
    (
      await fetch(url, {
        headers: { Authorization: `Bearer ${own.current.token}` },
      })
    ).status,
  ).toBe(401);
});
