import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/sessions', () => {
  it('deve retornar o usuário autenticado com session_token válido', async () => {
    const body = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'senha123',
    };

    const otpRecord = await orchestrator.createValidOtp(body.email);

    await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, otp_code: otpRecord.code }),
    });

    const loginRes = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });

    const cookie = loginRes.headers.get('set-cookie') ?? '';

    const response = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'GET',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.user.email).toBe(body.email.toLowerCase());
  });

  it('deve retornar 401 sem session_token', async () => {
    const response = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'GET',
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.user).toBeNull();
  });
});
