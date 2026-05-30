import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/groups', () => {
  it('creates a group with a valid name', async () => {
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

  it('returns 400 when the name is empty', async () => {
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

  it('returns 400 when the name exceeds 100 characters', async () => {
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

  it('returns 401 when not authenticated', async () => {
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
  it('lists the user groups', async () => {
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

  it('returns an empty array when the user has no groups', async () => {
    const token = await orchestrator.createUserAndToken();

    const response = await fetch('http://localhost:3000/api/v1/groups', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual([]);
  });

  it('does not list groups from another user', async () => {
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
