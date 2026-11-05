import crypto from 'crypto';
import http from 'http';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import password from 'models/password';
import session from 'models/session';

const url = 'http://localhost:3000/api/v1/mobile/sessions/others';
const secret = ' current-password ';
let own: Awaited<ReturnType<typeof setup>>;

async function setup(withPassword = true) {
  const user = await orchestrator.createUser();
  if (withPassword)
    await database.query('UPDATE users SET password = $1 WHERE id = $2', [
      await password.hash(secret),
      user.id,
    ]);
  const current = await orchestrator.createSessionForUser(user.id);
  await database.query(
    'UPDATE sessions SET expires_at = NULL WHERE token = $1',
    [current.token],
  );
  const other = await session.createForUser(user);
  return { user, current, other };
}

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  own = await setup();
});

async function request(options: RequestInit = {}, target = url) {
  const response = await fetch(target, {
    method: 'DELETE',
    body: JSON.stringify({ password: secret }),
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

async function sessions(userId: string) {
  return (
    await database.query(
      'SELECT * FROM sessions WHERE user_id = $1 ORDER BY id',
      [userId],
    )
  ).rows;
}

test('fresh password confirmation revokes only other sessions of the authenticated account and is idempotent', async () => {
  const another = await setup();
  const before = await sessions(another.user.id);
  const response = await request({
    headers: { Cookie: `session_token=${another.current.token}` },
  });
  expect(response.status).toBe(204);
  expect(await response.text()).toBe('');
  expect(await session.findOneValidByToken(own.current.token)).not.toBeNull();
  expect(await session.findOneValidByToken(own.other.token)).toBeNull();
  expect(await sessions(another.user.id)).toEqual(before);
  const after = await sessions(own.user.id);
  expect((await request()).status).toBe(204);
  expect(await sessions(own.user.id)).toEqual(after);
});

test('wrong password, trimmed password, and null-password accounts fail without modifying sessions', async () => {
  const before = await sessions(own.user.id);
  for (const value of ['incorrect', secret.trim()]) {
    const response = await request({
      body: JSON.stringify({ password: value }),
    });
    expect(response.status).toBe(403);
    expect(response.headers.get('www-authenticate')).toBeNull();
    expect(await response.json()).toEqual({
      name: 'ForbiddenError',
      message: 'Unable to confirm your current password.',
      action: 'Confirm your current password and try again.',
      status_code: 403,
    });
  }
  expect(await sessions(own.user.id)).toEqual(before);
  const googleOnly = await setup(false);
  const googleBefore = await sessions(googleOnly.user.id);
  const response = await request({
    headers: { Authorization: `Bearer ${googleOnly.current.token}` },
  });
  expect(response.status).toBe(403);
  expect(await sessions(googleOnly.user.id)).toEqual(googleBefore);
});

test.each([
  '',
  'Basic invalid',
  'Bearer short',
  `Bearer ${'a'.repeat(96)}, Bearer ${'b'.repeat(96)}`,
  `Bearer ${'A'.repeat(96)}`,
  `Bearer ${'f'.repeat(96)}`,
])(
  'rejects invalid Bearer %# without cookie fallback',
  async (Authorization) => {
    const before = await sessions(own.user.id);
    const response = await request({
      headers: { Authorization, Cookie: `session_token=${own.current.token}` },
    });
    expect(response.status).toBe(401);
    expect(await sessions(own.user.id)).toEqual(before);
  },
);

test('missing Bearer cannot authenticate using only a cookie', async () => {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Cookie: `session_token=${own.current.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: secret }),
  });
  expect(response.status).toBe(401);
  expect(response.headers.get('cache-control')).toBe('no-store');
});

test('expired and revoked credentials cannot revoke other sessions', async () => {
  const subject = await setup();
  await session.expireByToken(subject.current.token);
  const before = await sessions(subject.user.id);
  expect(
    (
      await request({
        headers: { Authorization: `Bearer ${subject.current.token}` },
      })
    ).status,
  ).toBe(401);
  expect(await sessions(subject.user.id)).toEqual(before);
});

test.each([
  '{}',
  '{',
  'null',
  JSON.stringify({ password: '' }),
  JSON.stringify({ password: 42 }),
  JSON.stringify({ password: secret, user_id: crypto.randomUUID() }),
  'x'.repeat(17000),
])('rejects invalid/oversized confirmation %#', async (body) => {
  const response = await request({ body });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    name: 'ValidationError',
    message: 'Invalid password confirmation request.',
    action: 'Send only your current password as JSON without query parameters.',
    status_code: 400,
  });
});

test('rejects query selectors and non-JSON media types', async () => {
  expect((await request({}, `${url}?user_id=${own.user.id}`)).status).toBe(400);
  expect(
    (await request({ headers: { 'Content-Type': 'text/plain' } })).status,
  ).toBe(400);
});

test.each(['GET', 'POST', 'PATCH', 'HEAD', 'OPTIONS'])(
  'only supports DELETE: %s',
  async (method) => {
    const response = await request({
      method,
      body: method === 'GET' || method === 'HEAD' ? undefined : '{',
    });
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('DELETE');
    if (method !== 'HEAD')
      expect(await response.json()).toEqual({
        name: 'MethodNotAllowedError',
        message: 'Method not allowed.',
        action: 'Use DELETE.',
        status_code: 405,
      });
  },
);

test('duplicate raw Authorization headers are rejected', async () => {
  const result = await new Promise<number | undefined>((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: 'DELETE',
        headers: [
          'Host',
          'localhost:3000',
          'Authorization',
          `Bearer ${own.current.token}`,
          'Authorization',
          `Bearer ${own.current.token}`,
        ],
      },
      (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      },
    );
    req.on('error', reject);
    req.end();
  });
  expect(result).toBe(401);
});

test('database failure returns sanitized 500 and does not falsely report successful cleanup', async () => {
  await database.query(
    'ALTER TABLE sessions RENAME TO security_sessions_unavailable',
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
  } finally {
    await database.query(
      'ALTER TABLE security_sessions_unavailable RENAME TO sessions',
    );
  }
});
