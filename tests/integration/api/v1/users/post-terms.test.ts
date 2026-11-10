import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
import { LEGAL_VERSION } from '@/lib/legal/shared';
import database from 'infra/database';

const TERMS_MESSAGE =
  'Aceite os Termos de Uso e a Política de Privacidade para criar a conta.';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function register(extra: Record<string, unknown>) {
  const email = faker.internet.email().toLowerCase();
  const otpRecord = await orchestrator.createValidOtp(email);
  const response = await fetch('http://localhost:3000/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: faker.person.fullName(),
      email,
      password: 'senha12345',
      otp_code: otpRecord.code,
      birth_day: 15,
      birth_month: 6,
      birth_year: 1990,
      ...extra,
    }),
  });
  return { response, email };
}

describe('POST /api/v1/users terms acceptance', () => {
  it('returns 400 when accepted_terms is missing', async () => {
    const { response, email } = await register({});

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.name).toBe('ValidationError');
    expect(data.message).toBe(TERMS_MESSAGE);

    const rows = await database.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);
    expect(rows.rowCount).toBe(0);
  });

  it('returns 400 when accepted_terms is false', async () => {
    const { response } = await register({ accepted_terms: false });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.name).toBe('ValidationError');
    expect(data.message).toBe(TERMS_MESSAGE);
  });

  it('stores the acceptance time and the legal version when accepted', async () => {
    const before = Date.now();
    const { response, email } = await register({ accepted_terms: true });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.terms_accepted_at).toBeUndefined();
    expect(data.terms_version).toBeUndefined();

    const row = (
      await database.query(
        'SELECT terms_accepted_at, terms_version FROM users WHERE email = $1',
        [email],
      )
    ).rows[0];
    expect(row.terms_version).toBe(LEGAL_VERSION);
    expect(row.terms_accepted_at.getTime()).toBeGreaterThanOrEqual(
      before - 5000,
    );
    expect(row.terms_accepted_at.getTime()).toBeLessThanOrEqual(
      Date.now() + 5000,
    );
  });
});
