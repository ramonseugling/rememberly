import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/groups/join', () => {
  it('deve entrar no grupo com código válido', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const memberToken = await orchestrator.createUserAndToken();

    const group = await orchestrator.createGroup(ownerToken, 'Família');

    const response = await fetch('http://localhost:3000/api/v1/groups/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ invite_code: group.invite_code }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.name).toBe('Família');
    expect(data.role).toBe('member');
    expect(data.member_count).toBe(2);
  });

  it('deve retornar 404 com código inválido', async () => {
    const token = await orchestrator.createUserAndToken();

    const response = await fetch('http://localhost:3000/api/v1/groups/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ invite_code: 'codigoinvalido' }),
    });

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.name).toBe('NotFoundError');
  });

  it('deve retornar 400 quando já é membro', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    const response = await fetch('http://localhost:3000/api/v1/groups/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ invite_code: group.invite_code }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 quando código está vazio', async () => {
    const token = await orchestrator.createUserAndToken();

    const response = await fetch('http://localhost:3000/api/v1/groups/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ invite_code: '' }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 401 quando não autenticado', async () => {
    const response = await fetch('http://localhost:3000/api/v1/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_code: 'qualquer' }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });
});
