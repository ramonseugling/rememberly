import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/groups', () => {
  it('deve criar um grupo com nome válido', async () => {
    const token = await orchestrator.createUserAndToken();

    const response = await fetch('http://localhost:3000/api/v1/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Família Silva' }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe('Família Silva');
    expect(data.invite_code).toBeDefined();
    expect(data.invite_code.length).toBe(8);
    expect(data.member_count).toBe(1);
    expect(data.role).toBe('owner');
    expect(data.created_at).toBeDefined();
  });

  it('deve retornar 400 quando nome está vazio', async () => {
    const token = await orchestrator.createUserAndToken();

    const response = await fetch('http://localhost:3000/api/v1/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: '' }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando nome excede 100 caracteres', async () => {
    const token = await orchestrator.createUserAndToken();

    const response = await fetch('http://localhost:3000/api/v1/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'A'.repeat(101) }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 401 quando não autenticado', async () => {
    const response = await fetch('http://localhost:3000/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Grupo' }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });
});

describe('GET /api/v1/groups', () => {
  it('deve listar grupos do usuário', async () => {
    const token = await orchestrator.createUserAndToken();

    await orchestrator.createGroup(token, 'Grupo A');
    await orchestrator.createGroup(token, 'Grupo B');

    const response = await fetch('http://localhost:3000/api/v1/groups', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.length).toBe(2);
    expect(data[0].role).toBeDefined();
    expect(data[0].member_count).toBeDefined();
  });

  it('deve retornar array vazio quando não tem grupos', async () => {
    const token = await orchestrator.createUserAndToken();

    const response = await fetch('http://localhost:3000/api/v1/groups', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual([]);
  });

  it('não deve listar grupos de outro usuário', async () => {
    const token1 = await orchestrator.createUserAndToken();
    const token2 = await orchestrator.createUserAndToken();

    await orchestrator.createGroup(token1, 'Grupo do User 1');

    const response = await fetch('http://localhost:3000/api/v1/groups', {
      headers: { Authorization: `Bearer ${token2}` },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.length).toBe(0);
  });
});
