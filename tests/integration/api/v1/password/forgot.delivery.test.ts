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
  it('allows up to 2 requests per hour', async () => {
    const createdUser = await createUserWithOtp();

    const first = await requestPasswordReset(createdUser.email);
    expect(first.status).toBe(200);

    const second = await requestPasswordReset(createdUser.email);
    expect(second.status).toBe(200);
  });
  it('does not count tokens created more than 1 hour ago', async () => {
    const createdUser = await createUserWithOtp();

    await database.query(
      `INSERT INTO password_reset_tokens (token, user_id, expires_at, created_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour', NOW() - INTERVAL '2 hours'),
                ($3, $4, NOW() + INTERVAL '1 hour', NOW() - INTERVAL '2 hours')`,
      [
        faker.string.hexadecimal({ length: 96, prefix: '' }),
        createdUser.id,
        faker.string.hexadecimal({ length: 96, prefix: '' }),
        createdUser.id,
      ],
    );

    const response = await requestPasswordReset(createdUser.email);
    expect(response.status).toBe(200);
  });
});
