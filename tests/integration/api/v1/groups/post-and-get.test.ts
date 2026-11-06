import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
import { getToday } from '@/lib/date-utils';
import group from 'models/group';
import groupMember from 'models/group-member';

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
  it('returns ordered birthdays through day 30 only within the authenticated memberships, excluding self', async () => {
    const today = getToday();
    const owner = await orchestrator.createUserAndSession({
      birth_day: today.getDate(),
      birth_month: today.getMonth() + 1,
    });
    const owned = await group.create(owner.user.id, { name: 'Família' });
    const second = await group.create(owner.user.id, { name: 'Equipe' });
    for (const offset of [30, 31, 0]) {
      const target = new Date(today);
      target.setDate(target.getDate() + offset);
      const member = await orchestrator.createUser({
        name: `Pessoa ${offset}`,
        birth_day: target.getDate(),
        birth_month: target.getMonth() + 1,
      });
      await groupMember.join(owned.invite_code, member.id);
      if (offset === 0) await groupMember.join(second.invite_code, member.id);
    }
    const stranger = await orchestrator.createUserAndSession();
    const privateGroup = await group.create(stranger.user.id, {
      name: 'Privado',
    });
    const outsider = await orchestrator.createUser({
      name: 'Pessoa privada',
      birth_day: today.getDate(),
      birth_month: today.getMonth() + 1,
    });
    await groupMember.join(privateGroup.invite_code, outsider.id);
    const response = await fetch('http://localhost:3000/api/v1/groups', {
      headers: { Authorization: `Bearer ${owner.session.token}` },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    const firstGroup = data.find(
      (entry: { id: string }) => entry.id === owned.id,
    );
    expect(firstGroup.upcoming_birthdays).toEqual([
      {
        name: 'Pessoa 0',
        birth_day: today.getDate(),
        birth_month: today.getMonth() + 1,
        days_until: 0,
      },
      expect.objectContaining({ name: 'Pessoa 30', days_until: 30 }),
    ]);
    expect(firstGroup.member_count).toBe(4);
    expect(
      data.find((entry: { id: string }) => entry.id === second.id)
        .upcoming_birthdays,
    ).toEqual([expect.objectContaining({ name: 'Pessoa 0', days_until: 0 })]);
    expect(Object.keys(firstGroup.upcoming_birthdays[0]).sort()).toEqual([
      'birth_day',
      'birth_month',
      'days_until',
      'name',
    ]);
    const otherResponse = await fetch('http://localhost:3000/api/v1/groups', {
      headers: { Authorization: `Bearer ${stranger.session.token}` },
    });
    const otherData = await otherResponse.json();
    expect(otherData).toHaveLength(1);
    expect(otherData[0].id).toBe(privateGroup.id);
    expect(otherData[0].upcoming_birthdays).toEqual([
      expect.objectContaining({ name: 'Pessoa privada', days_until: 0 }),
    ]);
  });
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
