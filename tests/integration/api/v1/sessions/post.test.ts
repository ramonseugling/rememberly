import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/sessions', () => {
  it('deve retornar token ao fazer login com credenciais válidas', async () => {
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

    const response = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.token).toBeDefined();
    expect(data.expires_at).toBeDefined();
  });

  it('deve retornar 401 com credenciais inválidas', async () => {
    const response = await fetch('http://localhost:3000/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'naoexiste@email.com',
        password: 'senhaerrada',
      }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });
});
