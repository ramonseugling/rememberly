import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createUserAndToken() {
  const userBody = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'senha123',
    birth_day: faker.number.int({ min: 1, max: 28 }),
    birth_month: faker.number.int({ min: 1, max: 12 }),
    birth_year: faker.number.int({ min: 1950, max: 2005 }),
  };

  const otpRecord = await orchestrator.createValidOtp(userBody.email);

  await fetch('http://localhost:3000/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userBody, otp_code: otpRecord.code }),
  });

  const userResult = await database.query(
    `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
    [userBody.email],
  );
  const userId = userResult.rows[0].id;

  const token = faker.string.alphanumeric(96);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await database.query(
    `INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expiresAt],
  );

  return { userBody, token };
}

describe('POST /api/v1/password/reset', () => {
  it('deve redefinir a senha com token válido', async () => {
    const { userBody, token } = await createUserAndToken();
    const newPassword = 'novaSenha456';

    const response = await fetch(
      'http://localhost:3000/api/v1/password/reset',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      },
    );

    expect(response.status).toBe(200);

    const loginResponse = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userBody.email, password: newPassword }),
    });

    expect(loginResponse.status).toBe(201);
  });

  it('não deve aceitar login com senha antiga após redefinição', async () => {
    const { userBody, token } = await createUserAndToken();

    await fetch('http://localhost:3000/api/v1/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: 'novaSenha789' }),
    });

    const loginResponse = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userBody.email,
        password: userBody.password,
      }),
    });

    expect(loginResponse.status).toBe(401);
  });

  it('deve retornar 400 para token inválido', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/password/reset',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'token-invalido',
          password: 'qualquerSenha',
        }),
      },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 para token já utilizado', async () => {
    const { token } = await createUserAndToken();

    await fetch('http://localhost:3000/api/v1/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: 'primeiraSenha' }),
    });

    const response = await fetch(
      'http://localhost:3000/api/v1/password/reset',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: 'segundaSenha' }),
      },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 para token expirado', async () => {
    const userBody = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'senha123',
      birth_day: faker.number.int({ min: 1, max: 28 }),
      birth_month: faker.number.int({ min: 1, max: 12 }),
      birth_year: faker.number.int({ min: 1950, max: 2005 }),
    };

    const otpRecord = await orchestrator.createValidOtp(userBody.email);

    await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userBody, otp_code: otpRecord.code }),
    });

    const userResult = await database.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [userBody.email],
    );
    const userId = userResult.rows[0].id;

    const expiredToken = faker.string.alphanumeric(96);
    const expiredAt = new Date(Date.now() - 1000);

    await database.query(
      `INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`,
      [expiredToken, userId, expiredAt],
    );

    const response = await fetch(
      'http://localhost:3000/api/v1/password/reset',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: expiredToken,
          password: 'qualquerSenha',
        }),
      },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando token ou senha não são informados', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/password/reset',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'algum-token' }),
      },
    );

    expect(response.status).toBe(400);
  });

  it('deve retornar 405 para método GET', async () => {
    const response = await fetch('http://localhost:3000/api/v1/password/reset');

    expect(response.status).toBe(405);
  });
});
