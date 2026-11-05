import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import {
  LOGIN_EMAIL_LIMIT,
  LOGIN_IP_LIMIT,
  consumeLoginEmail,
} from 'models/login-rate-limit';
import password from 'models/password';

const routes = ['/api/v1/sessions', '/api/v1/mobile/sessions'];
const secret = 'correct-password';
let email: string;

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  const user = await orchestrator.createUser();
  email = user.email;
  await database.query('UPDATE users SET password = $1 WHERE id = $2', [
    await password.hash(secret),
    user.id,
  ]);
});

beforeEach(async () => {
  await database.query('DELETE FROM login_rate_limits');
});

function login(
  route: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return fetch(`http://localhost:3000${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function assertLimited(response: Response) {
  expect(response.status).toBe(429);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('set-cookie')).toBeNull();
  const body = await response.json();
  expect(body).toEqual({
    name: 'TooManyRequestsError',
    message: 'Too many login attempts.',
    action: 'Wait before trying again.',
    status_code: 429,
    retry_after_seconds: expect.any(Number),
  });
  expect(body.retry_after_seconds).toBeGreaterThanOrEqual(1);
  expect(body.retry_after_seconds).toBeLessThanOrEqual(900);
  expect(response.headers.get('retry-after')).toBe(
    String(body.retry_after_seconds),
  );
  return body;
}

test('shares normalized email attempts across web/mobile, including successful logins', async () => {
  for (let attempt = 0; attempt < LOGIN_EMAIL_LIMIT; attempt++) {
    const route = routes[attempt % 2];
    const response = await login(route, {
      email: attempt % 2 ? ` ${email.toUpperCase()} ` : email,
      password: attempt === 0 ? secret : 'wrong-password',
    });
    expect(response.status).toBe(attempt === 0 ? 201 : 401);
    if (attempt === 0) {
      expect(response.headers.get('set-cookie')).toContain('HttpOnly');
      expect((await response.json()).token).toBeUndefined();
    }
  }
  for (const route of routes)
    await assertLimited(await login(route, { email, password: secret }));
  const buckets = await database.query(
    'SELECT scope, attempts FROM login_rate_limits ORDER BY scope',
  );
  expect(buckets.rows).toEqual([
    { scope: 'email', attempts: LOGIN_EMAIL_LIMIT + 1 },
    { scope: 'ip', attempts: LOGIN_EMAIL_LIMIT + 2 },
  ]);
});

test('unknown accounts receive the same budget and limit response as existing accounts', async () => {
  const unknown = 'unknown-rate-limit@example.com';
  for (let attempt = 0; attempt < LOGIN_EMAIL_LIMIT; attempt++) {
    expect(
      (await login(routes[attempt % 2], { email: unknown, password: secret }))
        .status,
    ).toBe(401);
  }
  await assertLimited(
    await login(routes[0], { email: unknown, password: secret }),
  );
  await assertLimited(
    await login(routes[1], { email: unknown, password: secret }),
  );
});

test('retains the budget across independent test and server processes', async () => {
  // The model runs in Jest; HTTP admission runs in the separate Next.js process.
  for (let attempt = 0; attempt < LOGIN_EMAIL_LIMIT; attempt++) {
    await consumeLoginEmail(email);
  }
  for (const route of routes) {
    await assertLimited(await login(route, { email, password: secret }));
  }
});

test('counts invalid requests in one source IP budget and ignores spoofed forwarding headers', async () => {
  for (let attempt = 0; attempt < LOGIN_IP_LIMIT; attempt++) {
    expect(
      (
        await login(
          routes[attempt % 2],
          {},
          {
            'x-forwarded-for': `198.51.100.${attempt + 1}`,
            'x-vercel-forwarded-for': `203.0.113.${attempt + 1}`,
          },
        )
      ).status,
    ).toBe(400);
  }
  for (const route of routes)
    await assertLimited(await login(route, { email, password: secret }));
  const buckets = await database.query(
    'SELECT scope, attempts FROM login_rate_limits',
  );
  expect(buckets.rows).toEqual([{ scope: 'ip', attempts: LOGIN_IP_LIMIT + 1 }]);
  // Exhaustion must not lock a user out of checking or revoking a session.
  expect((await fetch(`http://localhost:3000${routes[0]}`)).status).toBe(401);
  expect(
    (await fetch(`http://localhost:3000${routes[0]}`, { method: 'DELETE' }))
      .status,
  ).toBe(204);
});

test('simultaneous requests across both endpoints admit only the shared email budget', async () => {
  const responses = await Promise.all(
    Array.from({ length: LOGIN_EMAIL_LIMIT + 6 }, (_, index) =>
      login(routes[index % 2], {
        email: 'parallel-unknown@example.com',
        password: secret,
      }),
    ),
  );
  expect(responses.filter((response) => response.status === 401)).toHaveLength(
    LOGIN_EMAIL_LIMIT,
  );
  const denied = responses.filter((response) => response.status === 429);
  expect(denied).toHaveLength(6);
  for (const response of denied) await assertLimited(response);
});

test('fails closed on limiter storage failure without creating a session or leaking storage details', async () => {
  const before = (
    await database.query('SELECT count(*)::int AS count FROM sessions')
  ).rows[0].count;
  await database.query(
    'ALTER TABLE login_rate_limits RENAME TO login_limits_unavailable',
  );
  try {
    for (const route of routes) {
      const response = await login(route, { email, password: secret });
      expect(response.status).toBe(503);
      expect(response.headers.get('set-cookie')).toBeNull();
      expect(await response.json()).toEqual({
        name: 'ServiceError',
        message: 'Login is temporarily unavailable.',
        action: 'Try again later.',
        status_code: 503,
      });
    }
  } finally {
    await database.query(
      'ALTER TABLE login_limits_unavailable RENAME TO login_rate_limits',
    );
  }
  expect(
    (await database.query('SELECT count(*)::int AS count FROM sessions'))
      .rows[0].count,
  ).toBe(before);
});
