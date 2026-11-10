import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/users — marketing_consent', () => {
  async function createUserViaApi(
    email: string,
    extra: Record<string, unknown> = {},
  ) {
    const otpRecord = await orchestrator.createValidOtp(email);

    return fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: faker.person.fullName(),
        email,
        password: 'senha12345',
        accepted_terms: true,
        otp_code: otpRecord.code,
        birth_day: 10,
        birth_month: 5,
        birth_year: 1995,
        ...extra,
      }),
    });
  }

  test('defaults marketing_consent to true when omitted', async () => {
    const email = faker.internet.email().toLowerCase();
    const response = await createUserViaApi(email);

    expect(response.status).toBe(201);

    const row = await database.query(
      `SELECT marketing_consent FROM users WHERE LOWER(email) = LOWER($1)`,
      [email],
    );
    expect(row.rows[0].marketing_consent).toBe(true);
  });

  test('stores marketing_consent=true when explicitly set', async () => {
    const email = faker.internet.email().toLowerCase();
    const response = await createUserViaApi(email, { marketing_consent: true });

    expect(response.status).toBe(201);

    const row = await database.query(
      `SELECT marketing_consent FROM users WHERE LOWER(email) = LOWER($1)`,
      [email],
    );
    expect(row.rows[0].marketing_consent).toBe(true);
  });

  test('stores marketing_consent=false when explicitly set', async () => {
    const email = faker.internet.email().toLowerCase();
    const response = await createUserViaApi(email, {
      marketing_consent: false,
    });

    expect(response.status).toBe(201);

    const row = await database.query(
      `SELECT marketing_consent FROM users WHERE LOWER(email) = LOWER($1)`,
      [email],
    );
    expect(row.rows[0].marketing_consent).toBe(false);
  });
});
