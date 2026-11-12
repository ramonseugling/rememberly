import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createUserWithOtp() {
  const email = faker.internet.email();
  const otpRecord = await orchestrator.createValidOtp(email);
  const res = await fetch('http://localhost:3000/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: faker.person.fullName(),
      email,
      password: 'senha12345',
      birth_day: faker.number.int({ min: 1, max: 28 }),
      birth_month: faker.number.int({ min: 1, max: 12 }),
      birth_year: faker.number.int({ min: 1950, max: 2005 }),
      accepted_terms: true,
      otp_code: otpRecord.code,
    }),
  });
  expect(res.status).toBe(201);
  const createdUser = await res.json();
  return { ...createdUser, email };
}

describe('POST /api/v1/password/forgot', () => {
  it('returns 200 even when the email does not exist', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/password/forgot',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: faker.internet.email() }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.message).toBeDefined();
  });

  it('returns 200 with google_only for a Google account (without password)', async () => {
    const googleEmail = faker.internet.email();
    await database.query(`INSERT INTO users (name, email) VALUES ($1, $2)`, [
      faker.person.fullName(),
      googleEmail.toLowerCase(),
    ]);

    const response = await fetch(
      'http://localhost:3000/api/v1/password/forgot',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.google_only).toBe(true);

    const codes = await database.query(
      `SELECT COUNT(*)::int AS count FROM otp_tokens
       WHERE LOWER(email) = LOWER($1)`,
      [googleEmail],
    );

    expect(codes.rows[0].count).toBe(0);
  });

  it('returns 405 for the GET method', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/password/forgot',
    );

    expect(response.status).toBe(405);
  });

  it.each([{}, { email: 'invalid' }])(
    'rejects invalid reset input: %j',
    async (body) => {
      const response = await fetch(
        'http://localhost:3000/api/v1/password/forgot',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      expect(response.status).toBe(400);
      expect((await response.json()).name).toBe('ValidationError');
    },
  );

  describe('rate limiting', () => {
    async function requestPasswordReset(email: string) {
      return fetch('http://localhost:3000/api/v1/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    }

    it('returns 429 on the 6th code request within an hour', async () => {
      const createdUser = await createUserWithOtp();

      for (let index = 0; index < 5; index += 1) {
        await database.query(
          `INSERT INTO otp_tokens (email, code, expires_at, purpose)
           VALUES (LOWER($1), $2, NOW() + INTERVAL '10 minutes', 'password_reset')`,
          [createdUser.email, String(100000 + index)],
        );
      }

      const sixth = await requestPasswordReset(createdUser.email);
      expect(sixth.status).toBe(429);

      const data = await sixth.json();
      expect(data.name).toBe('TooManyRequestsError');
      const codes = await database.query(
        `SELECT COUNT(*)::int AS count FROM otp_tokens
         WHERE LOWER(email) = LOWER($1) AND purpose = 'password_reset'`,
        [createdUser.email],
      );
      expect(codes.rows[0].count).toBe(5);
    });
  });
});
