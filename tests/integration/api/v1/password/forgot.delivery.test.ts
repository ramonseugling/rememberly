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

async function requestPasswordReset(email: string) {
  return fetch('http://localhost:3000/api/v1/password/forgot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

describe('POST /api/v1/password/forgot (provider delivery)', () => {
  it('returns 200 when the email exists (without leaking information)', async () => {
    const createdUser = await createUserWithOtp();

    const response = await fetch(
      'http://localhost:3000/api/v1/password/forgot',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: createdUser.email }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.message).toBeDefined();
  });
  it('creates a password_reset code and never a link token', async () => {
    const createdUser = await createUserWithOtp();

    const response = await requestPasswordReset(createdUser.email);
    expect(response.status).toBe(200);

    const codes = await database.query(
      `SELECT code, purpose FROM otp_tokens
       WHERE LOWER(email) = LOWER($1) AND purpose = 'password_reset'`,
      [createdUser.email],
    );
    expect(codes.rows).toHaveLength(1);
    expect(codes.rows[0].code).toMatch(/^\d{6}$/);
    const tokens = await database.query(
      'SELECT COUNT(*)::int AS count FROM password_reset_tokens WHERE user_id = $1',
      [createdUser.id],
    );
    expect(tokens.rows[0].count).toBe(0);
  });
  it('allows up to 5 requests per hour', async () => {
    const createdUser = await createUserWithOtp();

    for (let index = 0; index < 5; index += 1) {
      const response = await requestPasswordReset(createdUser.email);
      expect(response.status).toBe(200);
    }
  });
  it('does not count codes created more than 1 hour ago', async () => {
    const createdUser = await createUserWithOtp();

    for (let index = 0; index < 5; index += 1) {
      await database.query(
        `INSERT INTO otp_tokens (email, code, expires_at, created_at, purpose)
         VALUES (LOWER($1), $2, NOW() - INTERVAL '1 hour',
                 NOW() - INTERVAL '2 hours', 'password_reset')`,
        [createdUser.email, String(200000 + index)],
      );
    }

    const response = await requestPasswordReset(createdUser.email);
    expect(response.status).toBe(200);
  });
});
