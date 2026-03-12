import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/users', () => {
  it('deve criar um usuário com OTP válido', async () => {
    const email = faker.internet.email();
    const otpRecord = await orchestrator.createValidOtp(email);

    const body = {
      name: faker.person.fullName(),
      email,
      password: 'senha12345',
      otp_code: otpRecord.code,
    };

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.email).toBe(body.email.toLowerCase());
    expect(data.password).toBeUndefined();
  });

  it('deve retornar 400 ao tentar criar usuário com e-mail duplicado', async () => {
    const email = faker.internet.email();
    const otpRecord = await orchestrator.createValidOtp(email);

    await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: faker.person.fullName(),
        email,
        password: 'senha12345',
        otp_code: otpRecord.code,
      }),
    });

    const otpRecord2 = await orchestrator.createValidOtp(email);

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: faker.person.fullName(),
        email,
        password: 'senha12345',
        otp_code: otpRecord2.code,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando otp_code não é enviado', async () => {
    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'senha12345',
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando código OTP está incorreto', async () => {
    const email = faker.internet.email();
    await orchestrator.createValidOtp(email);

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: faker.person.fullName(),
        email,
        password: 'senha12345',
        otp_code: '000000',
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
    expect(data.message).toBe('Código de verificação incorreto.');
  });

  it('deve retornar 400 quando OTP já foi utilizado', async () => {
    const email = faker.internet.email();
    const otpRecord = await orchestrator.createValidOtp(email);

    await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: faker.person.fullName(),
        email,
        password: 'senha12345',
        otp_code: otpRecord.code,
      }),
    });

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'senha12345',
        otp_code: otpRecord.code,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });
});
