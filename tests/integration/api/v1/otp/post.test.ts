import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/otp', () => {
  it('deve enviar OTP para e-mail válido e não registrado', async () => {
    const body = { email: faker.internet.email() };

    const response = await fetch('http://localhost:3000/api/v1/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.message).toBe('Código enviado com sucesso.');
  });

  it('deve retornar 400 quando e-mail já está em uso', async () => {
    const email = faker.internet.email();

    const otpRecord = await orchestrator.createValidOtp(email);

    await fetch('http://localhost:3000/api/v1/users', {
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

  it('deve retornar 400 quando e-mail é inválido', async () => {
    const response = await fetch('http://localhost:3000/api/v1/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalido' }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando body está vazio', async () => {
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
