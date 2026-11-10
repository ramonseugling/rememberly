import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

const BASE = 'http://localhost:3000/api/v1';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

function verify(email: string, otpCode: string) {
  return fetch(`${BASE}/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp_code: otpCode }),
  });
}

function register(email: string, extra: Record<string, unknown>) {
  return fetch(`${BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: faker.person.fullName(),
      email,
      password: 'senha12345',
      birth_day: 15,
      birth_month: 6,
      birth_year: 1990,
      accepted_terms: true,
      ...extra,
    }),
  });
}

describe('POST /api/v1/otp/verify', () => {
  it('confirms the code and returns a verification token', async () => {
    const email = faker.internet.email().toLowerCase();
    const otpRecord = await orchestrator.createValidOtp(email);

    const response = await verify(email, otpRecord.code);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.verification_token).toMatch(/^[0-9a-f]{64}$/);
    const stored = await database.query(
      'SELECT token_hash FROM email_verifications WHERE email = $1',
      [email],
    );
    expect(stored.rows[0].token_hash).not.toBe(data.verification_token);
  });

  it('does not accept the same code twice', async () => {
    const email = faker.internet.email().toLowerCase();
    const otpRecord = await orchestrator.createValidOtp(email);
    expect((await verify(email, otpRecord.code)).status).toBe(200);

    const second = await verify(email, otpRecord.code);

    expect(second.status).toBe(400);
  });

  it('rejects a wrong code and counts the attempt', async () => {
    const email = faker.internet.email().toLowerCase();
    const otpRecord = await orchestrator.createValidOtp(email);
    const wrong = otpRecord.code === '000000' ? '111111' : '000000';

    const response = await verify(email, wrong);

    expect(response.status).toBe(400);
    expect((await response.json()).name).toBe('ValidationError');
    const stored = await database.query(
      'SELECT attempts FROM otp_tokens WHERE id = $1',
      [otpRecord.id],
    );
    expect(stored.rows[0].attempts).toBe(1);
  });

  it('validates the payload', async () => {
    const response = await fetch(`${BASE}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', otp_code: '12' }),
    });
    expect(response.status).toBe(400);
  });
});

describe('POST /api/v1/users with a verification token', () => {
  it('creates the account without sending the code again', async () => {
    const email = faker.internet.email().toLowerCase();
    const otpRecord = await orchestrator.createValidOtp(email);
    const { verification_token } = await (
      await verify(email, otpRecord.code)
    ).json();

    const response = await register(email, { verification_token });

    expect(response.status).toBe(201);
    expect((await response.json()).email).toBe(email);
  });

  it('keeps the token valid when the account data is rejected', async () => {
    const email = faker.internet.email().toLowerCase();
    const otpRecord = await orchestrator.createValidOtp(email);
    const { verification_token } = await (
      await verify(email, otpRecord.code)
    ).json();

    const rejected = await register(email, {
      verification_token,
      birth_year: new Date().getFullYear() - 5,
    });
    expect(rejected.status).toBe(400);

    const retry = await register(email, { verification_token });
    expect(retry.status).toBe(201);
  });

  it('uses the token only once', async () => {
    const email = faker.internet.email().toLowerCase();
    const otpRecord = await orchestrator.createValidOtp(email);
    const { verification_token } = await (
      await verify(email, otpRecord.code)
    ).json();
    expect((await register(email, { verification_token })).status).toBe(201);

    const again = await register(email, { verification_token });

    expect(again.status).toBe(400);
  });

  it('rejects a token issued for another e-mail', async () => {
    const owner = faker.internet.email().toLowerCase();
    const otpRecord = await orchestrator.createValidOtp(owner);
    const { verification_token } = await (
      await verify(owner, otpRecord.code)
    ).json();

    const response = await register(faker.internet.email().toLowerCase(), {
      verification_token,
    });

    expect(response.status).toBe(400);
  });

  it('rejects unknown and expired tokens', async () => {
    const email = faker.internet.email().toLowerCase();
    const unknown = await register(email, {
      verification_token: 'a'.repeat(64),
    });
    expect(unknown.status).toBe(400);

    const otpRecord = await orchestrator.createValidOtp(email);
    const { verification_token } = await (
      await verify(email, otpRecord.code)
    ).json();
    await database.query(
      `UPDATE email_verifications SET expires_at = NOW() - INTERVAL '1 minute'
       WHERE LOWER(email) = $1`,
      [email],
    );
    const expired = await register(email, { verification_token });
    expect(expired.status).toBe(400);
    expect((await expired.json()).message).toBe(
      'A verificação do e-mail é inválida ou expirou.',
    );
  });

  it('still accepts the OTP code directly (web sign-up)', async () => {
    const email = faker.internet.email().toLowerCase();
    const otpRecord = await orchestrator.createValidOtp(email);

    const response = await register(email, { otp_code: otpRecord.code });

    expect(response.status).toBe(201);
  });
});
