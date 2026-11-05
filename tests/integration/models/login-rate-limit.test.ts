import type { NextApiRequest } from 'next';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import {
  LOGIN_CLEANUP_BATCH,
  LOGIN_EMAIL_LIMIT,
  LOGIN_IP_LIMIT,
  LOGIN_WINDOW_SECONDS,
  LoginLimitError,
  LoginLimitUnavailableError,
  consumeLoginEmail,
  consumeLoginIp,
} from 'models/login-rate-limit';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

beforeEach(async () => {
  await database.query('DELETE FROM login_rate_limits');
});

function source(address = '198.51.100.7') {
  return { socket: { remoteAddress: address }, headers: {} } as NextApiRequest;
}

test('atomically admits only the email budget under concurrent attempts', async () => {
  const results = await Promise.allSettled(
    Array.from({ length: LOGIN_EMAIL_LIMIT + 6 }, (_, index) =>
      consumeLoginEmail(
        index % 2 ? ' Alice@Example.COM ' : 'alice@example.com',
      ),
    ),
  );
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(LOGIN_EMAIL_LIMIT);
  for (const result of results.filter(
    (result) => result.status === 'rejected',
  )) {
    expect(result.reason).toBeInstanceOf(LoginLimitError);
    expect(result.reason.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(result.reason.retryAfterSeconds).toBeLessThanOrEqual(
      LOGIN_WINDOW_SECONDS,
    );
  }
  const rows = await database.query('SELECT * FROM login_rate_limits');
  expect(rows.rows).toHaveLength(1);
  expect(rows.rows[0]).toEqual({
    bucket_id: expect.stringMatching(/^[a-f0-9]{64}$/),
    scope: 'email',
    attempts: LOGIN_EMAIL_LIMIT + 1,
    expires_at: expect.any(Date),
  });
  expect(JSON.stringify(rows.rows)).not.toMatch(/alice|example\.com/i);
});

test('shares the source IP budget across requests without coupling unrelated email buckets', async () => {
  const results = await Promise.allSettled(
    Array.from({ length: LOGIN_IP_LIMIT + 1 }, () => consumeLoginIp(source())),
  );
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(LOGIN_IP_LIMIT);
  const denied = results.find((result) => result.status === 'rejected');
  expect(denied?.status === 'rejected' && denied.reason).toBeInstanceOf(
    LoginLimitError,
  );
  await expect(consumeLoginIp(source('198.51.100.8'))).resolves.toBeUndefined();
  await expect(consumeLoginEmail('new@example.com')).resolves.toBeUndefined();
});

test('derives Retry-After from PostgreSQL expiry and time', async () => {
  for (let attempt = 0; attempt < LOGIN_EMAIL_LIMIT; attempt++) {
    await consumeLoginEmail('retry@example.com');
  }
  const before = await database.query(
    `SELECT ceil(extract(epoch FROM (expires_at - statement_timestamp())))::int AS seconds
     FROM login_rate_limits`,
  );
  let denied: unknown;
  try {
    await consumeLoginEmail('retry@example.com');
  } catch (error) {
    denied = error;
  }
  expect(denied).toBeInstanceOf(LoginLimitError);
  if (!(denied instanceof LoginLimitError)) throw new Error('Expected denial');
  expect(denied.retryAfterSeconds).toBeLessThanOrEqual(before.rows[0].seconds);
  expect(denied.retryAfterSeconds).toBeGreaterThanOrEqual(
    before.rows[0].seconds - 2,
  );
});

test('cleans only a bounded batch of expired windows while admitting a fresh window', async () => {
  await database.query(
    `INSERT INTO login_rate_limits (bucket_id,scope,attempts,expires_at)
     SELECT 'expired-' || value, 'email', 11, statement_timestamp() - interval '1 second'
     FROM generate_series(1, $1::integer) AS value`,
    [LOGIN_CLEANUP_BATCH * 2 + 5],
  );
  await consumeLoginEmail('fresh-window@example.com');
  const expired = await database.query(
    'SELECT count(*)::int AS count FROM login_rate_limits WHERE expires_at <= statement_timestamp()',
  );
  expect(expired.rows[0].count).toBe(LOGIN_CLEANUP_BATCH + 5);
  const current = await database.query(
    'SELECT attempts FROM login_rate_limits WHERE expires_at > statement_timestamp()',
  );
  expect(current.rows).toEqual([{ attempts: 1 }]);
});

test('fails closed with a sanitized service error when storage is unavailable', async () => {
  await database.query(
    'ALTER TABLE login_rate_limits RENAME TO login_limits_unavailable',
  );
  try {
    await expect(
      consumeLoginEmail('private@example.com'),
    ).rejects.toMatchObject({
      name: 'ServiceError',
      message: 'Login is temporarily unavailable.',
      status_code: 503,
    });
    await expect(consumeLoginIp(source())).rejects.toBeInstanceOf(
      LoginLimitUnavailableError,
    );
  } finally {
    await database.query(
      'ALTER TABLE login_limits_unavailable RENAME TO login_rate_limits',
    );
  }
});
