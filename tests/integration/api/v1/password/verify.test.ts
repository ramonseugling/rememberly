import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import otp from 'models/otp';
import password from 'models/password';

const BASE = 'http://localhost:3000/api/v1';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createAccount() {
  const email = faker.internet.email().toLowerCase();
  const otpRecord = await orchestrator.createValidOtp(email);
  const response = await fetch(`${BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: faker.person.fullName(),
      email,
      password: 'senha12345',
      birth_day: 10,
      birth_month: 5,
      birth_year: 1990,
      accepted_terms: true,
      otp_code: otpRecord.code,
    }),
  });
  expect(response.status).toBe(201);
  return email;
}

function post(path: string, body: unknown) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Codes are created through the model: asking for one over HTTP sends an
// e-mail, which CI cannot do (the delivery suites cover that).
async function issueResetCode(email: string) {
  const record = await otp.create(email, 'password_reset');
  return record.code as string;
}

describe('password reset by e-mailed code', () => {
  it('goes from the code to a new password end to end', async () => {
    const email = await createAccount();
    const code = await issueResetCode(email);

    const verified = await post('/password/verify', { email, otp_code: code });
    expect(verified.status).toBe(200);
    const { reset_token } = await verified.json();
    expect(reset_token).toMatch(/^[0-9a-f]{96}$/);

    const reset = await post('/password/reset', {
      token: reset_token,
      password: 'nova-senha-123',
    });
    expect(reset.status).toBe(200);
    const stored = await database.query(
      'SELECT password FROM users WHERE email = $1',
      [email],
    );
    expect(
      await password.compare('nova-senha-123', stored.rows[0].password),
    ).toBe(true);
  });

  it('uses each code only once', async () => {
    const email = await createAccount();
    const code = await issueResetCode(email);
    const first = await post('/password/verify', { email, otp_code: code });
    expect(first.status).toBe(200);

    const again = await post('/password/verify', { email, otp_code: code });

    expect(again.status).toBe(400);
  });

  it('rejects a wrong code and counts the attempt', async () => {
    const email = await createAccount();
    const code = await issueResetCode(email);
    const wrong = code === '000000' ? '111111' : '000000';

    const response = await post('/password/verify', { email, otp_code: wrong });

    expect(response.status).toBe(400);
    const stored = await database.query(
      `SELECT attempts FROM otp_tokens
       WHERE LOWER(email) = LOWER($1) AND purpose = 'password_reset'`,
      [email],
    );
    expect(stored.rows[0].attempts).toBe(1);
  });

  it('does not accept a sign-up code for a password reset', async () => {
    const email = await createAccount();
    const signupCode = await orchestrator.createValidOtp(email);

    const response = await post('/password/verify', {
      email,
      otp_code: signupCode.code,
    });

    expect(response.status).toBe(400);
  });

  it('answers the same way for unknown e-mails', async () => {
    const response = await post('/password/verify', {
      email: faker.internet.email(),
      otp_code: '123456',
    });

    expect(response.status).toBe(400);
  });

  it('validates the payload and the method', async () => {
    const invalid = await post('/password/verify', {
      email: 'x',
      otp_code: '1',
    });
    expect(invalid.status).toBe(400);
    expect((await fetch(`${BASE}/password/verify`)).status).toBe(405);
  });
});
