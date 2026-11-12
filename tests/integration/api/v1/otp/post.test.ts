import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/otp', () => {
  it('returns 400 when the email is already in use', async () => {
    const email = faker.internet.email();

    const otpRecord = await orchestrator.createValidOtp(email);

    const registration = await fetch('http://localhost:3000/api/v1/users', {
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

    expect(registration.status).toBe(201);

    const response = await fetch('http://localhost:3000/api/v1/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
    expect(data.message).toBe('Este e-mail já está em uso.');
  });

  it('returns 429 after five codes requested for the same e-mail within an hour', async () => {
    const email = faker.internet.email();

    for (let i = 0; i < 5; i++) {
      await orchestrator.createValidOtp(email);
    }

    const response = await fetch('http://localhost:3000/api/v1/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.name).toBe('TooManyRequestsError');
  });

  it('returns 400 when the email is invalid', async () => {
    const response = await fetch('http://localhost:3000/api/v1/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalido' }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('returns 400 when the body is empty', async () => {
    const response = await fetch('http://localhost:3000/api/v1/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });
});
