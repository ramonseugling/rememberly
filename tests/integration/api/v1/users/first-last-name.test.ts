import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function register(body: Record<string, unknown>) {
  const email = faker.internet.email().toLowerCase();
  const otpRecord = await orchestrator.createValidOtp(email);

  const response = await fetch('http://localhost:3000/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'senha12345',
      accepted_terms: true,
      otp_code: otpRecord.code,
      birth_day: 10,
      birth_month: 5,
      birth_year: 1995,
      ...body,
    }),
  });

  return { response, email };
}

describe('first and last name', () => {
  it('stores first_name, last_name and the joined full name', async () => {
    const { response } = await register({
      first_name: 'Maria',
      last_name: 'da Silva',
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.first_name).toBe('Maria');
    expect(data.last_name).toBe('da Silva');
    expect(data.name).toBe('Maria da Silva');
  });

  it('splits a legacy full name at the first space', async () => {
    const { response } = await register({ name: 'João Pedro Souza' });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.first_name).toBe('João');
    expect(data.last_name).toBe('Pedro Souza');
    expect(data.name).toBe('João Pedro Souza');
  });

  it('accepts a first name without last name', async () => {
    const { response } = await register({ first_name: 'Madonna' });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.last_name).toBeNull();
    expect(data.name).toBe('Madonna');
  });

  it('returns 400 when no name is sent', async () => {
    const { response } = await register({});

    expect(response.status).toBe(400);
  });

  it('updates first and last name together through PATCH', async () => {
    const cookie = await orchestrator.createAuthCookie();

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ first_name: 'Ana', last_name: 'Lima' }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.first_name).toBe('Ana');
    expect(data.last_name).toBe('Lima');
    expect(data.name).toBe('Ana Lima');
  });

  it('returns 400 for one-letter names or names with digits or symbols', async () => {
    for (const body of [
      { first_name: 'A', last_name: 'Silva' },
      { first_name: 'Ana', last_name: 'S' },
      { first_name: 'Ana3', last_name: 'Silva' },
      { first_name: 'Ana-Maria', last_name: 'Silva' },
      { first_name: 'Ana', last_name: "D'Ávila" },
    ]) {
      const { response } = await register(body);
      expect(response.status).toBe(400);
    }
  });

  it('explains that only letters are allowed', async () => {
    const { response } = await register({
      first_name: 'Ana-Maria',
      last_name: 'Silva',
    });
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe('Use apenas letras no nome.');
  });
});
