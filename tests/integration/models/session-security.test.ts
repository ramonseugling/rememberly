import crypto from 'crypto';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import password from 'models/password';
import passwordReset from 'models/password-reset';
import session from 'models/session';
import sessionSecurity from 'models/session-security';

const initialPassword = ' initial-password ';
const newPassword = 'new-password-123';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function fixture() {
  const user = await orchestrator.createUser();
  const hash = await password.hash(initialPassword);
  await database.query('UPDATE users SET password = $1 WHERE id = $2', [
    hash,
    user.id,
  ]);
  const resetToken = crypto.randomBytes(48).toString('hex');
  await database.query(
    "INSERT INTO password_reset_tokens (token,user_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL '1 hour')",
    [resetToken, user.id],
  );
  const persistent = await session.createPersistent(
    user.email,
    initialPassword,
  );
  const finite = await session.createForUser(user);
  return { user, hash, resetToken, persistent, finite };
}

async function state(userId: string) {
  return {
    user: (
      await database.query('SELECT password FROM users WHERE id = $1', [userId])
    ).rows[0],
    tokens: (
      await database.query(
        'SELECT * FROM password_reset_tokens WHERE user_id = $1 ORDER BY id',
        [userId],
      )
    ).rows,
    sessions: (
      await database.query(
        'SELECT * FROM sessions WHERE user_id = $1 ORDER BY id',
        [userId],
      )
    ).rows,
  };
}

test('successful reset consumes the token, changes password and revokes finite and persistent sessions only for that user', async () => {
  const own = await fixture();
  const unrelated = await fixture();
  const beforeOther = await state(unrelated.user.id);
  await passwordReset.resetPassword(own.resetToken, newPassword);
  expect(await session.findOneValidByToken(own.persistent.token)).toBeNull();
  expect(await session.findOneValidByToken(own.finite.token)).toBeNull();
  const after = await state(own.user.id);
  expect(after.tokens[0].used_at).toBeInstanceOf(Date);
  expect(await password.compare(newPassword, after.user.password)).toBe(true);
  expect(await state(unrelated.user.id)).toEqual(beforeOther);
  await expect(
    session.createPersistent(own.user.email, initialPassword),
  ).rejects.toMatchObject({ name: 'UnauthorizedError' });
  expect(
    (await session.createPersistent(own.user.email, newPassword)).expires_at,
  ).toBeNull();
});

test.each(['unknown', 'expired', 'used'])(
  'invalid %s reset leaves password and all sessions unchanged',
  async (kind) => {
    const own = await fixture();
    if (kind === 'expired')
      await database.query(
        'UPDATE password_reset_tokens SET expires_at = NOW() WHERE token = $1',
        [own.resetToken],
      );
    if (kind === 'used')
      await database.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
        [own.resetToken],
      );
    const before = await state(own.user.id);
    await expect(
      passwordReset.resetPassword(
        kind === 'unknown' ? 'unrecognized-token' : own.resetToken,
        newPassword,
      ),
    ).rejects.toMatchObject({ name: 'ValidationError' });
    expect(await state(own.user.id)).toEqual(before);
  },
);

test('a failed session revocation rolls back password and reset-token consumption', async () => {
  const own = await fixture();
  const before = await state(own.user.id);
  await database.query(
    `CREATE FUNCTION fail_security_session_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic revocation failure'; END $$`,
  );
  await database.query(
    'CREATE TRIGGER fail_security_session_update BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION fail_security_session_update()',
  );
  try {
    await expect(
      passwordReset.resetPassword(own.resetToken, newPassword),
    ).rejects.toThrow('Synthetic revocation failure');
    expect(await state(own.user.id)).toEqual(before);
    await expect(
      sessionSecurity.revokeOtherSessions(
        own.persistent.token,
        initialPassword,
      ),
    ).rejects.toThrow('Synthetic revocation failure');
    expect(await state(own.user.id)).toEqual(before);
  } finally {
    await database.query(
      'DROP TRIGGER fail_security_session_update ON sessions',
    );
    await database.query('DROP FUNCTION fail_security_session_update()');
  }
  await passwordReset.resetPassword(own.resetToken, newPassword);
});

test('concurrent attempts cannot consume the same reset token twice or overwrite the winning password', async () => {
  const own = await fixture();
  const outcomes = await Promise.allSettled([
    passwordReset.resetPassword(own.resetToken, 'first-new-password'),
    passwordReset.resetPassword(own.resetToken, 'second-new-password'),
  ]);
  expect(
    outcomes.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  expect(
    outcomes.filter((result) => result.status === 'rejected'),
  ).toHaveLength(1);
  const winner =
    outcomes[0].status === 'fulfilled'
      ? 'first-new-password'
      : 'second-new-password';
  expect(
    await password.compare(winner, (await state(own.user.id)).user.password),
  ).toBe(true);
});

async function waitForBlockedQuery(fragment: string) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const result = await database.query(
      "SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND position($1 in query) > 0",
      [fragment],
    );
    if (result.rows[0].count > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(
    'Expected security operation to wait on the controlled database lock.',
  );
}

test.each(['finite', 'persistent'])(
  'a %s password login authenticated before reset cannot issue a valid old-password token afterward',
  async (kind) => {
    const own = await fixture();
    const blocker = await database.getNewClient();
    let reset: Promise<PromiseSettledResult<void>[]> | undefined;
    let issuance: Promise<PromiseSettledResult<unknown>[]> | undefined;
    try {
      await blocker.query('BEGIN');
      await blocker.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [
        own.user.id,
      ]);
      reset = Promise.allSettled([
        passwordReset.resetPassword(own.resetToken, newPassword),
      ]);
      await waitForBlockedQuery('UPDATE users SET password =');
      issuance = Promise.allSettled([
        kind === 'persistent'
          ? session.createPersistent(own.user.email, initialPassword)
          : session.create(own.user.email, initialPassword),
      ]);
      await waitForBlockedQuery('SELECT password FROM users WHERE id =');
      await blocker.query('COMMIT');
      expect((await reset)[0].status).toBe('fulfilled');
      const result = (await issuance)[0];
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected')
        expect(result.reason).toMatchObject({ name: 'UnauthorizedError' });
      expect(
        (await state(own.user.id)).sessions.every(
          (row: { expires_at: Date | null }) =>
            row.expires_at !== null && row.expires_at.getTime() <= Date.now(),
        ),
      ).toBe(true);
    } finally {
      await blocker.query('ROLLBACK');
      await blocker.end();
      await reset;
      await issuance;
    }
  },
);
