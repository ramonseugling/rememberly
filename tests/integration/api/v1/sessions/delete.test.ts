import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('DELETE /api/v1/sessions', () => {
  it('deve encerrar a sessão e limpar o cookie', async () => {
    const body = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'senha123',
    };

    await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const loginRes = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });

    const cookie = loginRes.headers.get('set-cookie') ?? '';

    const response = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');

    const checkRes = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'GET',
      headers: { Cookie: cookie },
    });

    expect(checkRes.status).toBe(401);
  });

  it('deve retornar 204 mesmo sem session_token', async () => {
    const response = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);
  });
});
