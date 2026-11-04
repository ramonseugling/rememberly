import crypto from 'crypto';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import group from 'models/group';
import password from 'models/password';
import session from 'models/session';

const url = 'http://localhost:3000/api/v1/account-deletion';
const origin = new URL(process.env.APP_URL!).origin;
const secret = ' current web password ';
let identity: Awaited<ReturnType<typeof orchestrator.createUserAndSession>>;
async function request(options: RequestInit = {}, target = url) {
  const response = await fetch(target, {
    method: 'POST',
    body: JSON.stringify({ password: secret, confirmation: 'DELETE' }),
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      Cookie: `session_token=${identity.session.token}`,
      ...options.headers,
    },
  });
  expect(response.headers.get('cache-control')).toBe('no-store');
  return response;
}
async function userExists() {
  return (
    await database.query('SELECT id FROM users WHERE id=$1', [identity.user.id])
  ).rows.length;
}
beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});
beforeEach(async () => {
  identity = await orchestrator.createUserAndSession();
  await database.query('UPDATE users SET password=$1 WHERE id=$2', [
    await password.hash(secret),
    identity.user.id,
  ]);
});

test('public page explains deletion and offers the existing login without exposing credentials', async () => {
  const response = await fetch('http://localhost:3000/account-deletion');
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('no-store');
  const html = await response.text();
  expect(html).toContain('Delete your Rememberly account');
  expect(html).toContain('/login?next=%2Faccount-deletion');
  expect(html).toContain('delete every group you own first');
  expect(html).not.toContain(identity.session.token);
});

test('authenticated SSR exposes only a safe identity and renders password confirmation', async () => {
  const response = await fetch('http://localhost:3000/account-deletion', {
    headers: { Cookie: `session_token=${identity.session.token}` },
  });
  const html = await response.text();
  expect(response.status).toBe(200);
  const props = JSON.parse(
    html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)![1],
  ).props.pageProps;
  expect(props).toEqual({
    user: { name: identity.user.name, email: identity.user.email },
  });
  expect(html).toContain('Permanently delete my account');
  expect(html).not.toContain(identity.session.token);
  expect(html).not.toContain(secret);
});

test.each(['', 'null', 'https://evil.example', `${origin}.evil.example`])(
  'rejects untrusted or missing Origin %s',
  async (Origin) => {
    expect((await request({ headers: { Origin } })).status).toBe(403);
    expect(await userExists()).toBe(1);
  },
);

test('rejects cross-site metadata even with a matching Origin', async () => {
  expect(
    (await request({ headers: { 'Sec-Fetch-Site': 'cross-site' } })).status,
  ).toBe(403);
  expect(await userExists()).toBe(1);
});

test.each(['', 'session_token=short', `session_token=${'f'.repeat(96)}`])(
  'rejects invalid cookies and never falls back to a valid Bearer %#',
  async (Cookie) => {
    expect(
      (
        await request({
          headers: {
            Cookie,
            Authorization: `Bearer ${identity.session.token}`,
          },
        })
      ).status,
    ).toBe(401);
    expect(await userExists()).toBe(1);
  },
);

test('expired and duplicate cookies cannot select an account', async () => {
  await session.expireByToken(identity.session.token);
  expect((await request()).status).toBe(401);
  const another = await orchestrator.createUserAndSession();
  expect(
    (
      await request({
        headers: {
          Cookie: `session_token=${another.session.token}; session_token=${identity.session.token}`,
        },
      })
    ).status,
  ).toBe(401);
  expect(await userExists()).toBe(1);
});

test.each([
  '{',
  '{}',
  'null',
  JSON.stringify({ password: secret, confirmation: 'delete' }),
  JSON.stringify({
    password: secret,
    confirmation: 'DELETE',
    user_id: crypto.randomUUID(),
  }),
  'x'.repeat(17000),
])('rejects malformed input %#', async (body) => {
  expect((await request({ body })).status).toBe(400);
  expect(await userExists()).toBe(1);
});

test('rejects non-JSON requests, query parameters, and unsupported methods', async () => {
  expect(
    (await request({ headers: { 'Content-Type': 'text/plain' } })).status,
  ).toBe(400);
  expect((await request({}, `${url}?user_id=${identity.user.id}`)).status).toBe(
    400,
  );
  const response = await request({ method: 'DELETE' });
  expect(response.status).toBe(405);
  expect(response.headers.get('allow')).toBe('POST');
  expect(await userExists()).toBe(1);
});

test('wrong passwords and passwordless accounts return403 while preserving the login', async () => {
  for (const supplied of ['wrong', secret.trim()]) {
    const response = await request({
      body: JSON.stringify({ password: supplied, confirmation: 'DELETE' }),
    });
    expect(response.status).toBe(403);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect((await response.json()).message).toBe(
      'Unable to confirm your current password.',
    );
  }
  await database.query('UPDATE users SET password=NULL WHERE id=$1', [
    identity.user.id,
  ]);
  expect((await request()).status).toBe(403);
  expect(
    await session.findOneValidByToken(identity.session.token),
  ).not.toBeNull();
});

test('owned groups block deletion, preserving the group and session', async () => {
  const owned = await group.create(identity.user.id, {
    name: 'Keep owned group',
  });
  const response = await request();
  expect(response.status).toBe(409);
  expect((await response.json()).action).toBe(
    'Delete the groups you own before deleting your account.',
  );
  expect(response.headers.get('set-cookie')).toBeNull();
  expect(await userExists()).toBe(1);
  expect(
    (await database.query('SELECT id FROM groups WHERE id=$1', [owned.id]))
      .rows,
  ).toHaveLength(1);
  expect(
    await session.findOneValidByToken(identity.session.token),
  ).not.toBeNull();
});

test('unexpected database failure returns a safe error and preserves the session', async () => {
  await database.query(
    "CREATE FUNCTION reject_web_account_deletion() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private test detail'; END $$",
  );
  await database.query(
    'CREATE TRIGGER reject_web_account_deletion BEFORE DELETE ON users FOR EACH ROW EXECUTE FUNCTION reject_web_account_deletion()',
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
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await userExists()).toBe(1);
    expect(
      await session.findOneValidByToken(identity.session.token),
    ).not.toBeNull();
  } finally {
    await database.query('DROP TRIGGER reject_web_account_deletion ON users');
    await database.query('DROP FUNCTION reject_web_account_deletion()');
  }
});

test('same-origin password confirmation deletes cookie account only, clears cookie and revokes all its sessions', async () => {
  const another = await orchestrator.createUserAndSession();
  const persistent = await orchestrator.createSessionForUser(identity.user.id);
  await database.query('UPDATE sessions SET expires_at=NULL WHERE id=$1', [
    persistent.id,
  ]);
  const response = await request({
    headers: {
      Authorization: `Bearer ${another.session.token}`,
      'Sec-Fetch-Site': 'same-origin',
    },
  });
  expect(response.status).toBe(204);
  expect(await response.text()).toBe('');
  expect(response.headers.get('set-cookie')).toContain(
    'session_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
  );
  expect(await userExists()).toBe(0);
  expect(await session.findOneValidByToken(identity.session.token)).toBeNull();
  expect(await session.findOneValidByToken(persistent.token)).toBeNull();
  expect(
    await session.findOneValidByToken(another.session.token),
  ).not.toBeNull();
  expect((await request()).status).toBe(401);
});
