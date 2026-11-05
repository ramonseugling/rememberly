import crypto from 'crypto';
import orchestrator from 'tests/orchestrator';
import database from '@/infra/database';
import {
  completeMobileGoogleLogin,
  startMobileGoogleLogin,
} from '@/models/mobile-google-login';

const origin = 'http://localhost:3000';
const root = `${origin}/api/v1/mobile/auth/google`;
const random = () => crypto.randomBytes(32).toString('hex');
beforeAll(async () => {
  if (!new URL(process.env.DATABASE_URL!).pathname.endsWith('_test'))
    throw new Error('Use an isolated test database');
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

test('start accepts only app state and S256 challenge and sets a separate browser cookie', async () => {
  const state = random();
  const challenge = crypto
    .createHash('sha256')
    .update(random())
    .digest('base64url');
  const response = await fetch(
    `${root}/start?state=${state}&code_challenge=${challenge}`,
    { redirect: 'manual' },
  );
  expect(response.status).toBe(302);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const target = new URL(response.headers.get('location')!);
  expect(target.origin).toBe('https://accounts.google.com');
  expect(target.searchParams.get('redirect_uri')).toBe(
    `${origin}/api/v1/mobile/auth/google/callback`,
  );
  const cookie = response.headers.get('set-cookie')!;
  expect(cookie).toContain('mobile_google_state=');
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Lax');
  expect(cookie).not.toContain('session_token=');
  for (const suffix of [
    '',
    `?state=${state}&code_challenge=${challenge}&redirect_uri=https://evil.test`,
  ]) {
    expect(
      (await fetch(`${root}/start${suffix}`, { redirect: 'manual' })).status,
    ).toBe(400);
  }
});

test('callback rejects unbound requests and returns provider cancellation without issuing a session', async () => {
  const before = (
    await database.query('SELECT count(*)::int AS count FROM sessions')
  ).rows[0].count;
  expect(
    (
      await fetch(`${root}/callback?state=${random()}&code=fake`, {
        redirect: 'manual',
      })
    ).status,
  ).toBe(401);
  const state = random();
  const oauth = await startMobileGoogleLogin(state, 'a'.repeat(43));
  const response = await fetch(
    `${root}/callback?state=${oauth}&error=access_denied`,
    { redirect: 'manual', headers: { Cookie: `mobile_google_state=${oauth}` } },
  );
  expect(response.status).toBe(302);
  const target = new URL(response.headers.get('location')!);
  expect(target.href).toBe(
    `rememberly://auth/google?state=${state}&error=cancelled`,
  );
  expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  expect(
    (await database.query('SELECT count(*)::int AS count FROM sessions'))
      .rows[0].count,
  ).toBe(before);
});

test('exchange redeems one PKCE-bound code with no cookie session or replay', async () => {
  const state = random();
  const verifier = random();
  const oauth = await startMobileGoogleLogin(
    state,
    crypto.createHash('sha256').update(verifier).digest('base64url'),
  );
  const user = await orchestrator.createUser();
  const returnUrl = new URL(
    await completeMobileGoogleLogin(oauth, oauth, user.id),
  );
  const code = returnUrl.searchParams.get('code');
  const send = (body: unknown) =>
    fetch(`${root}/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  expect((await send({ code, state, code_verifier: random() })).status).toBe(
    401,
  );
  expect(
    (await send({ code, state, code_verifier: verifier, token: 'unexpected' }))
      .status,
  ).toBe(400);
  const response = await send({ code, state, code_verifier: verifier });
  expect(response.status).toBe(201);
  expect(response.headers.get('set-cookie')).toBeNull();
  expect(response.headers.get('cache-control')).toBe('no-store');
  const session = await response.json();
  expect(session.user.id).toBe(user.id);
  expect(session.token).toMatch(/^[a-f0-9]{96}$/);
  expect(session.expires_at).toBeNull();
  expect((await send({ code, state, code_verifier: verifier })).status).toBe(
    401,
  );
  const identity = await fetch(`${origin}/api/v1/mobile/me`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(identity.status).toBe(200);
});

test('unsupported HTTP methods are rejected', async () => {
  expect((await fetch(`${root}/start`, { method: 'POST' })).status).toBe(405);
  expect((await fetch(`${root}/callback`, { method: 'POST' })).status).toBe(
    405,
  );
  expect((await fetch(`${root}/exchange`)).status).toBe(405);
});
