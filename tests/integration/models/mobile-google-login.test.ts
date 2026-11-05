import crypto from 'crypto';
import orchestrator from 'tests/orchestrator';
import database from '@/infra/database';
import { UnauthorizedError, ValidationError } from '@/infra/errors';
import googleAuth from '@/models/google-auth';
import {
  completeMobileGoogleLogin,
  exchangeMobileGoogleLogin,
  pendingMobileGoogleLogin,
  startMobileGoogleLogin,
} from '@/models/mobile-google-login';
import session from '@/models/session';

beforeAll(async () => {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith('_test'))
    throw new Error('Use an isolated test database');
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

const random = () => crypto.randomBytes(32).toString('hex');
async function flow() {
  const state = random();
  const verifier = random();
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
  const oauth = await startMobileGoogleLogin(state, challenge);
  return { state, verifier, oauth, challenge };
}
async function ready() {
  const login = await flow();
  const user = await orchestrator.createUser();
  const result = new URL(
    await completeMobileGoogleLogin(login.oauth, login.oauth, user.id),
  );
  return { ...login, user, code: result.searchParams.get('code')! };
}

test('uses the approved web account lookup for existing users and creates new Google accounts', async () => {
  const existing = await orchestrator.createUser();
  const found = await googleAuth.findOrCreateUser({
    email: existing.email.toUpperCase(),
    name: 'Unchanged',
  });
  expect(found.id).toBe(existing.id);
  expect(found.name).toBe(existing.name);
  const created = await googleAuth.findOrCreateUser({
    email: `${random()}@example.test`,
    name: 'Google User',
  });
  expect(created.id).toBeTruthy();
  expect(
    (
      await database.query('SELECT password FROM users WHERE id=$1', [
        created.id,
      ])
    ).rows[0].password,
  ).toBeNull();
});

test('binds the OAuth browser cookie and stores only digests of secrets', async () => {
  const login = await flow();
  expect(await pendingMobileGoogleLogin(login.oauth, login.oauth)).toBe(
    login.state,
  );
  await expect(
    pendingMobileGoogleLogin(login.oauth, random()),
  ).rejects.toBeInstanceOf(UnauthorizedError);
  await expect(
    pendingMobileGoogleLogin('invalid', login.oauth),
  ).rejects.toBeInstanceOf(UnauthorizedError);
  const row = (
    await database.query(
      'SELECT * FROM mobile_google_logins WHERE app_state=$1',
      [login.state],
    )
  ).rows[0];
  expect(row.oauth_state_hash).not.toBe(login.oauth);
  expect(row.oauth_state_hash).toHaveLength(64);
});

test('rejects malformed starts and expired browser callbacks', async () => {
  await expect(
    startMobileGoogleLogin('invalid', 'invalid'),
  ).rejects.toBeInstanceOf(ValidationError);
  const login = await flow();
  await database.query(
    'UPDATE mobile_google_logins SET expires_at=NOW() WHERE app_state=$1',
    [login.state],
  );
  await expect(
    pendingMobileGoogleLogin(login.oauth, login.oauth),
  ).rejects.toBeInstanceOf(UnauthorizedError);
});

test('returns only a one-time code and requires the matching verifier and app state', async () => {
  const login = await ready();
  const row = (
    await database.query(
      'SELECT * FROM mobile_google_logins WHERE app_state=$1',
      [login.state],
    )
  ).rows[0];
  expect(row.code_hash).not.toBe(login.code);
  await expect(
    exchangeMobileGoogleLogin(login.code, random(), login.state),
  ).rejects.toBeInstanceOf(UnauthorizedError);
  await expect(
    exchangeMobileGoogleLogin(login.code, login.verifier, random()),
  ).rejects.toBeInstanceOf(UnauthorizedError);
  const created = await exchangeMobileGoogleLogin(
    login.code,
    login.verifier,
    login.state,
  );
  expect(created.user.id).toBe(login.user.id);
  expect(created.expires_at).toBeNull();
  expect(created.token).toMatch(/^[a-f0-9]{96}$/);
  expect((await session.findOneValidByToken(created.token)).user_id).toBe(
    login.user.id,
  );
  await expect(
    exchangeMobileGoogleLogin(login.code, login.verifier, login.state),
  ).rejects.toBeInstanceOf(UnauthorizedError);
  await expect(
    completeMobileGoogleLogin(login.oauth, login.oauth, login.user.id),
  ).rejects.toBeInstanceOf(UnauthorizedError);
});

test('expired codes and deleted users cannot create sessions', async () => {
  const expired = await ready();
  await database.query(
    'UPDATE mobile_google_logins SET expires_at=NOW() WHERE app_state=$1',
    [expired.state],
  );
  await expect(
    exchangeMobileGoogleLogin(expired.code, expired.verifier, expired.state),
  ).rejects.toBeInstanceOf(UnauthorizedError);
  const deleted = await ready();
  await database.query('DELETE FROM users WHERE id=$1', [deleted.user.id]);
  await expect(
    exchangeMobileGoogleLogin(deleted.code, deleted.verifier, deleted.state),
  ).rejects.toBeInstanceOf(UnauthorizedError);
});

test('concurrent exchanges have one winner and issue one session', async () => {
  const login = await ready();
  const results = await Promise.allSettled(
    [1, 2].map(() =>
      exchangeMobileGoogleLogin(login.code, login.verifier, login.state),
    ),
  );
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  expect(
    (
      await database.query(
        'SELECT count(*)::int AS count FROM sessions WHERE user_id=$1',
        [login.user.id],
      )
    ).rows[0].count,
  ).toBe(1);
});

test('web Google keeps its original callback while mobile supplies its own', () => {
  const original = new URL(googleAuth.getAuthorizationUrl('state'));
  expect(original.searchParams.get('redirect_uri')).toBe(
    `${process.env.APP_URL}/api/v1/auth/google/callback`,
  );
  const mobile = new URL(
    googleAuth.getAuthorizationUrl(
      'state',
      'https://example.test/api/v1/mobile/auth/google/callback',
    ),
  );
  expect(mobile.searchParams.get('redirect_uri')).toBe(
    'https://example.test/api/v1/mobile/auth/google/callback',
  );
});
