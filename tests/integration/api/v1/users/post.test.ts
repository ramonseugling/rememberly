import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/users', () => {
  it('creates a user with a valid OTP', async () => {
    const email = faker.internet.email();
    const otpRecord = await orchestrator.createValidOtp(email);

    const body = {
      name: faker.person.fullName(),
      email,
      password: 'senha12345',
      otp_code: otpRecord.code,
      birth_day: 15,
      birth_month: 6,
      birth_year: 1990,
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
    expect(data.birth_day).toBe(15);
    expect(data.birth_month).toBe(6);
    expect(data.birth_year).toBe(1990);
  });

  it('returns 400 when creating a user with a duplicate email', async () => {
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
        birth_day: 1,
        birth_month: 1,
        birth_year: 2000,
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
        birth_day: 1,
        birth_month: 1,
        birth_year: 2000,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('returns 400 when otp_code is not sent', async () => {
    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'senha12345',
        birth_day: 1,
        birth_month: 1,
        birth_year: 2000,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('returns 400 when the OTP code is incorrect', async () => {
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
        birth_day: 1,
        birth_month: 1,
        birth_year: 2000,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
    expect(data.message).toBe('Código de verificação incorreto.');
  });

  it('returns 400 when the OTP was already used', async () => {
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
        birth_day: 1,
        birth_month: 1,
        birth_year: 2000,
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
        birth_day: 1,
        birth_month: 1,
        birth_year: 2000,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('returns 400 when birth fields are not sent', async () => {
    const email = faker.internet.email();
    const otpRecord = await orchestrator.createValidOtp(email);

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: faker.person.fullName(),
        email,
        password: 'senha12345',
        otp_code: otpRecord.code,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('returns 400 when the birth day is invalid', async () => {
    const email = faker.internet.email();
    const otpRecord = await orchestrator.createValidOtp(email);

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: faker.person.fullName(),
        email,
        password: 'senha12345',
        otp_code: otpRecord.code,
        birth_day: 32,
        birth_month: 1,
        birth_year: 2000,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });
});
