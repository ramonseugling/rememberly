import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/users', () => {
  it('deve criar um usuário com dados válidos', async () => {
    const body = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'senha123',
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

    const response = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });
});
