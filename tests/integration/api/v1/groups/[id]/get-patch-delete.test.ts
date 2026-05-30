import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/groups/[id]', () => {
  it('returns group details for a member', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Família');

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.name).toBe('Família');
    expect(data.invite_code).toBeDefined();
    expect(data.role).toBe('owner');
    expect(data.member_count).toBe(1);
    expect(data.members).toBeDefined();
    expect(data.members.length).toBe(1);
  });

  it('returns 404 for a non-member', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const otherToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Privado');

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}`,
      {
        headers: { Authorization: `Bearer ${otherToken}` },
      },
    );

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.name).toBe('NotFoundError');
  });
});

describe('PATCH /api/v1/groups/[id]', () => {
  it('updates the name when the user is owner', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Nome Antigo');

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ name: 'Nome Novo' }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.name).toBe('Nome Novo');
  });

  it('returns 401 when a member tries to update', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const memberToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    await orchestrator.joinGroup(memberToken, group.invite_code);

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ name: 'Tentativa' }),
      },
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  it('returns 404 when a non-member tries to update', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const otherToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherToken}`,
        },
        body: JSON.stringify({ name: 'Hackeado' }),
      },
    );

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/v1/groups/[id]', () => {
  it('deletes the group when the user is owner', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Deletar');

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    expect(response.status).toBe(204);

    const getResponse = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    expect(getResponse.status).toBe(404);
  });

  it('returns 401 when a member tries to delete', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const memberToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    await orchestrator.joinGroup(memberToken, group.invite_code);

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${memberToken}` },
      },
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });
});
