import crypto from 'crypto';
import http from 'http';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import password from 'models/password';
import session from 'models/session';

const base = 'http://localhost:3000';
const path = '/api/v1/mobile/sessions';
const secret = ' example-password ';
let user: { id: string; name: string; email: string };
let other: { id: string; name: string; email: string };

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  user = await orchestrator.createUser();
  other = await orchestrator.createUser();
  await database.query('UPDATE users SET password = $1 WHERE id = $2', [
    await password.hash(secret),
    user.id,
  ]);
});

async function request(
  method = 'GET',
  token?: string,
  options: RequestInit = {},
) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('set-cookie')).toBeNull();
  return response;
}

async function login(body: unknown = { email: user.email, password: secret }) {
  return request('POST', undefined, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function issue() {
  const response = await login();
  expect(response.status).toBe(201);
  return response.json();
}

async function assertUnauthorized(response: Response, loginFailure = false) {
  expect(response.status).toBe(401);
  expect(response.headers.get('www-authenticate')).toBe(
    'Bearer realm="rememberly"',
  );
  expect(await response.json()).toEqual({
    name: 'UnauthorizedError',
    message: loginFailure
      ? 'Invalid email or password.'
      : 'A valid Bearer session is required.',
    action: loginFailure
      ? 'Check your credentials and try again.'
      : 'Sign in and send your session token in the Authorization header.',
    status_code: 401,
  });
}

describe('mobile session lifecycle', () => {
  test('creates persistent sessions with an exact public response and distinct tokens', async () => {
    const first = await issue();
    const second = await issue();
    expect(first).toEqual({
      token: expect.stringMatching(/^[a-f0-9]{96}$/),
      token_type: 'Bearer',
      expires_at: null,
      user: { id: user.id, name: user.name, email: user.email },
    });
    expect(second.token).not.toBe(first.token);
    const rows = await database.query(
      'SELECT * FROM sessions WHERE token = $1',
      [first.token],
    );
    expect(rows.rows[0]).toMatchObject({ user_id: user.id, expires_at: null });
  });

  test('preserves password whitespace, normalizes email lookup, and ignores lifetime/identity input', async () => {
    const response = await login({
      email: `  ${user.email.toUpperCase()}  `,
      password: secret,
      user_id: other.id,
      expires_at: '2099-01-01T00:00:00Z',
      token: 'chosen-token',
      is_admin: true,
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      expires_at: null,
      user: { id: user.id },
    });
    await assertUnauthorized(
      await login({ email: user.email, password: secret.trim() }),
      true,
    );
  });

  test('POST authenticates only body credentials and leaves incidental sessions valid', async () => {
    const cookieSession = await session.createForUser(other);
    const response = await request('POST', 'invalid-token', {
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_token=${cookieSession.token}`,
      },
      body: JSON.stringify({ email: user.email, password: secret }),
    });
    expect(response.status).toBe(201);
    expect((await response.json()).user.id).toBe(user.id);
    expect(
      await session.findOneValidByToken(cookieSession.token),
    ).not.toBeNull();
  });

  test('persistent sessions remain valid after 30 days and return current identity without a token', async () => {
    const issued = await issue();
    await database.query(
      "UPDATE sessions SET created_at = NOW() - INTERVAL '400 days' WHERE token = $1",
      [issued.token],
    );
    await database.query('UPDATE users SET name = $1 WHERE id = $2', [
      'Updated Name',
      user.id,
    ]);
    const response = await request('GET', issued.token);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      expires_at: null,
      user: { id: user.id, name: 'Updated Name', email: user.email },
    });
    const events = await fetch(`${base}/api/v1/events`, {
      headers: { Authorization: `Bearer ${issued.token}` },
    });
    expect(events.status).toBe(200);
    expect((await events.json()).events).toEqual([]);
    await database.query('UPDATE users SET name = $1 WHERE id = $2', [
      user.name,
      user.id,
    ]);
  });

  test('finite web sessions remain finite, including model creation for OAuth', async () => {
    const before = Date.now();
    const web = await session.create(user.email, secret);
    const oauth = await session.createForUser(other);
    for (const row of [web, oauth]) {
      const lifetime = row.expires_at.getTime() - before;
      expect(lifetime).toBeGreaterThanOrEqual(30 * 86400 * 1000);
      expect(lifetime).toBeLessThan(30 * 86400 * 1000 + 10000);
      const response = await request('GET', row.token);
      expect(response.status).toBe(200);
      expect((await response.json()).expires_at).toBe(
        row.expires_at.toISOString(),
      );
    }
  });

  test.each(['NOW()', "NOW() - INTERVAL '1 day'"])(
    'rejects finite expiration at %s',
    async (expiration) => {
      const issued = await issue();
      await database.query(
        `UPDATE sessions SET expires_at = ${expiration} WHERE token = $1`,
        [issued.token],
      );
      await assertUnauthorized(await request('GET', issued.token));
    },
  );

  test('revokes only the presented session and supports idempotent deletion', async () => {
    const first = await issue();
    const second = await issue();
    const cookie = await session.createForUser(other);
    const response = await request('DELETE', first.token, {
      headers: { Cookie: `session_token=${cookie.token}` },
    });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    await assertUnauthorized(await request('GET', first.token));
    expect(
      (
        await fetch(`${base}/api/v1/events`, {
          headers: { Authorization: `Bearer ${first.token}` },
        })
      ).status,
    ).toBe(401);
    expect((await request('GET', second.token)).status).toBe(200);
    expect(await session.findOneValidByToken(cookie.token)).not.toBeNull();
    expect((await request('DELETE', first.token)).status).toBe(204);
    expect(
      (await request('DELETE', crypto.randomBytes(48).toString('hex'))).status,
    ).toBe(204);
  });

  test('account deletion invalidates persistent sessions', async () => {
    const temporary = await orchestrator.createUser();
    await database.query('UPDATE users SET password = $1 WHERE id = $2', [
      await password.hash(secret),
      temporary.id,
    ]);
    const response = await login({ email: temporary.email, password: secret });
    const issued = await response.json();
    expect(response.status).toBe(201);
    await database.query('DELETE FROM users WHERE id = $1', [temporary.id]);
    await assertUnauthorized(await request('GET', issued.token));
  });
});

describe('validation and non-enumerating failures', () => {
  test.each([
    {},
    null,
    [],
    { email: 'bad', password: secret },
    { email: 'alex@example.com' },
    { email: 'alex@example.com', password: '' },
    { email: 123, password: false },
  ])('rejects invalid input %#', async (body) => {
    const response = await login(body);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      name: 'ValidationError',
      message: 'Invalid login request.',
      action: 'Provide a valid email address and a nonempty password.',
      status_code: 400,
    });
  });

  test.each(['{', '', 'x'.repeat(17000)])(
    'rejects malformed or oversized JSON %#',
    async (body) => {
      const response = await request('POST', undefined, {
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      expect(response.status).toBe(400);
      expect((await response.json()).name).toBe('ValidationError');
    },
  );

  test('rejects non-JSON media types', async () => {
    const response = await request('POST', undefined, {
      body: JSON.stringify({ email: user.email, password: secret }),
    });
    expect(response.status).toBe(400);
  });

  test('unknown account, wrong password, and Google-only account have identical failures and create no sessions', async () => {
    const count = async () =>
      (await database.query('SELECT COUNT(*)::int AS count FROM sessions'))
        .rows[0].count;
    const before = await count();
    for (const body of [
      { email: `${crypto.randomUUID()}@example.com`, password: secret },
      { email: user.email, password: 'wrong' },
      { email: other.email, password: secret },
    ])
      await assertUnauthorized(await login(body), true);
    expect(await count()).toBe(before);
  });
});

describe('credential selection and methods', () => {
  test('does not accept a token in the URL or request body', async () => {
    const issued = await issue();
    const response = await fetch(
      `${base}${path}?token=ignored-query-credential`,
    );
    await assertUnauthorized(response);
    await assertUnauthorized(
      await request('DELETE', undefined, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: issued.token }),
      }),
    );
  });

  test.each([
    undefined,
    '',
    'Basic abc',
    'Bearer',
    'Bearer ',
    'Bearer short',
    `Bearer ${'A'.repeat(96)}`,
    `Bearer ${'a'.repeat(96)} extra`,
    `Bearer ${'a'.repeat(96)}, Bearer ${'b'.repeat(96)}`,
    `Bearer\t${'a'.repeat(96)}`,
  ])(
    'rejects malformed authorization %# without falling back to a valid cookie',
    async (authorization) => {
      const cookie = await session.createForUser(user);
      for (const method of ['GET', 'DELETE']) {
        await assertUnauthorized(
          await request(method, undefined, {
            headers: {
              Cookie: `session_token=${cookie.token}`,
              ...(authorization === undefined
                ? {}
                : { Authorization: authorization }),
            },
          }),
        );
      }
      expect(await session.findOneValidByToken(cookie.token)).not.toBeNull();
    },
  );

  test('uses Bearer over a conflicting cookie on mobile, but preserves cookie-first shared APIs', async () => {
    const issued = await issue();
    const cookie = await session.createForUser(other);
    await database.query(
      "INSERT INTO events (title, type, event_day, event_month, user_id) VALUES ('Cookie event', 'birthday', 1, 1, $1)",
      [other.id],
    );
    const headers = {
      Authorization: `Bearer ${issued.token}`,
      Cookie: `session_token=${cookie.token}`,
    };
    expect(
      (await (await request('GET', undefined, { headers })).json()).user.id,
    ).toBe(user.id);
    const shared = await fetch(`${base}/api/v1/events`, { headers });
    expect(shared.status).toBe(200);
    expect((await shared.json()).events[0].title).toBe('Cookie event');
    const invalidCookie = { ...headers, Cookie: 'session_token=invalid' };
    expect(
      (await fetch(`${base}/api/v1/events`, { headers: invalidCookie })).status,
    ).toBe(401);
    await assertUnauthorized(
      await request('GET', 'a'.repeat(96), {
        headers: { Cookie: `session_token=${cookie.token}` },
      }),
    );
  });

  test('accepts case-insensitive scheme and surrounding whitespace', async () => {
    const issued = await issue();
    expect(
      (
        await request('GET', undefined, {
          headers: { Authorization: `  bEaReR   ${issued.token}  ` },
        })
      ).status,
    ).toBe(200);
  });

  test('rejects duplicate raw Authorization fields', async () => {
    const issued = await issue();
    const result = await new Promise<{
      status?: number;
      body: string;
      cache?: string;
    }>((resolve, reject) => {
      const req = http.request(
        `${base}${path}`,
        {
          headers: [
            'Host',
            'localhost:3000',
            'Authorization',
            `Bearer ${issued.token}`,
            'Authorization',
            `Bearer ${issued.token}`,
          ],
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () =>
            resolve({
              status: res.statusCode,
              body,
              cache: res.headers['cache-control'],
            }),
          );
        },
      );
      req.on('error', reject);
      req.end();
    });
    expect(result.status).toBe(401);
    expect(result.cache).toBe('no-store');
    expect(JSON.parse(result.body).name).toBe('UnauthorizedError');
  });

  test.each(['PUT', 'PATCH', 'OPTIONS', 'HEAD'])(
    'rejects unsupported %s',
    async (method) => {
      const response = await request(method);
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('GET, POST, DELETE');
      if (method !== 'HEAD')
        expect((await response.json()).message).toBe('Method not allowed.');
    },
  );

  test('database failures return sanitized 500 responses rather than authentication failure or false logout success', async () => {
    const issued = await issue();
    await database.query('ALTER TABLE sessions RENAME TO sessions_unavailable');
    try {
      for (const response of [
        await login(),
        await request('GET', issued.token),
        await request('DELETE', issued.token),
      ]) {
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
          name: 'InternalServerError',
          message: 'An unexpected error occurred.',
          action: 'Try again later.',
          status_code: 500,
        });
      }
    } finally {
      await database.query(
        'ALTER TABLE sessions_unavailable RENAME TO sessions',
      );
    }
    expect((await request('GET', issued.token)).status).toBe(200);
  });
});
