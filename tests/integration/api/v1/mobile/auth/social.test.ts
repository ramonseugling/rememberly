import type { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import { consumeLoginIp } from 'models/login-rate-limit';
import { nativeSocialHandler } from 'models/native-social-auth-controller';

const original = process.env.GOOGLE_NATIVE_CLIENT_IDS;
let ip = 1;
beforeAll(async () => {
  process.env.GOOGLE_NATIVE_CLIENT_IDS = 'native-fixture-client';
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});
afterAll(() => {
  if (original === undefined) delete process.env.GOOGLE_NATIVE_CLIENT_IDS;
  else process.env.GOOGLE_NATIVE_CLIENT_IDS = original;
});

function request(
  body: unknown,
  options: {
    method?: string;
    query?: Record<string, string>;
    contentType?: string;
    raw?: string;
  } = {},
) {
  return Object.assign(Readable.from([options.raw ?? JSON.stringify(body)]), {
    method: options.method ?? 'POST',
    query: options.query ?? {},
    headers: { 'content-type': options.contentType ?? 'application/json' },
    socket: { remoteAddress: `192.0.2.${ip++}` },
  }) as unknown as NextApiRequest;
}
async function call(operation: 'challenges' | 'exchange', req: NextApiRequest) {
  const output = {
    status: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
  };
  const res = {
    setHeader(name: string, value: string) {
      output.headers[name.toLowerCase()] = value;
    },
    status(status: number) {
      output.status = status;
      return this;
    },
    json(body: unknown) {
      output.body = body;
      return this;
    },
  } as unknown as NextApiResponse;
  await nativeSocialHandler(operation)(req, res);
  expect(output.headers['cache-control']).toBe('no-store');
  expect(output.headers['set-cookie']).toBeUndefined();
  return output;
}

const valid = { provider: 'google', purpose: 'login' };
test('challenge endpoint returns a bounded login nonce without creating sessions', async () => {
  const result = await call('challenges', request(valid));
  expect(result.status).toBe(201);
  expect(result.body).toMatchObject({
    purpose: 'login',
    nonce: expect.stringMatching(/^[a-f0-9]{64}$/),
    challenge_id: expect.any(String),
  });
  expect((await database.query('SELECT * FROM sessions')).rows).toHaveLength(0);
});

test.each([
  [{ provider: 'google' }, {}],
  [{ ...valid, email: 'untrusted@example.test' }, {}],
  [{ ...valid, purpose: 'link' }, {}],
  [{ ...valid, provider: 'unknown' }, {}],
  [valid, { query: { token: 'untrusted' } }],
  [valid, { contentType: 'text/plain' }],
  [valid, { raw: '{bad json' }],
  [valid, { raw: 'x'.repeat(21 * 1024) }],
])('rejects malformed/unknown challenge request %j', async (body, options) => {
  expect((await call('challenges', request(body, options))).status).toBe(400);
});

test.each(['GET', 'DELETE', 'PUT'])(
  'rejects %s with an explicit POST-only contract',
  async (method) => {
    const output = await call('exchange', request({}, { method }));
    expect(output.status).toBe(405);
    expect(output.headers.allow).toBe('POST');
  },
);

test('unconfigured provider returns sanitized 503 and does not create a challenge', async () => {
  const before = (
    await database.query('SELECT count(*) FROM native_social_challenges')
  ).rows[0].count;
  delete process.env.GOOGLE_NATIVE_CLIENT_IDS;
  try {
    const output = await call('challenges', request(valid));
    expect(output.status).toBe(503);
    expect(output.body).toEqual({
      name: 'ServiceError',
      message: 'Social login is temporarily unavailable.',
      action: 'Try another sign-in method or try again later.',
      status_code: 503,
    });
    expect(
      (await database.query('SELECT count(*) FROM native_social_challenges'))
        .rows[0].count,
    ).toBe(before);
  } finally {
    process.env.GOOGLE_NATIVE_CLIENT_IDS = 'native-fixture-client';
  }
});

test('exchange rejects raw identity fields and malformed proof with sanitized output', async () => {
  const fields = {
    provider: 'google',
    challenge_id: '00000000-0000-4000-8000-000000000000',
    identity_token: 'raw-fixture-token-not-a-jwt',
  };
  expect(
    (
      await call(
        'exchange',
        request({
          ...fields,
          email: 'attacker@example.test',
          subject: 'attacker',
        }),
      )
    ).status,
  ).toBe(400);
  const output = await call('exchange', request(fields));
  expect(output.status).toBe(401);
  expect(JSON.stringify(output.body)).not.toContain(fields.identity_token);
  expect(output.body).toMatchObject({
    name: 'UnauthorizedError',
    message: 'Invalid social login proof.',
  });
});

test('challenge creation and exchange share the bounded durable IP budget', async () => {
  const req = request(valid);
  for (let attempt = 0; attempt < 100; attempt++) await consumeLoginIp(req);
  const before = (
    await database.query('SELECT count(*) FROM native_social_challenges')
  ).rows[0].count;
  const first = await call('challenges', req);
  expect(first.status).toBe(429);
  expect(Number(first.headers['retry-after'])).toBeGreaterThan(0);
  const exchange = request({});
  exchange.socket = req.socket;
  expect((await call('exchange', exchange)).status).toBe(429);
  expect(
    (await database.query('SELECT count(*) FROM native_social_challenges'))
      .rows[0].count,
  ).toBe(before);
});
