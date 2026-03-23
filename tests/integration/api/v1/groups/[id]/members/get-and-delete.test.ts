import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/groups/[id]/members', () => {
  it('deve listar membros com informações de aniversário', async () => {
    const ownerToken = await orchestrator.createUserAndToken({
      birth_day: 15,
      birth_month: 3,
    });
    const memberToken = await orchestrator.createUserAndToken({
      birth_day: 20,
      birth_month: 7,
    });

    const group = await orchestrator.createGroup(ownerToken, 'Família');
    await orchestrator.joinGroup(memberToken, group.invite_code);

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.length).toBe(2);

    // Owner should be first
    expect(data[0].role).toBe('owner');
    expect(data[0].birth_day).toBe(15);
    expect(data[0].birth_month).toBe(3);

    expect(data[1].role).toBe('member');
    expect(data[1].birth_day).toBe(20);
    expect(data[1].birth_month).toBe(7);
  });

  it('deve retornar 404 para não-membro', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const otherToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Privado');

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members`,
      {
        headers: { Authorization: `Bearer ${otherToken}` },
      },
    );

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/v1/groups/[id]/members/[userId]', () => {
  it('deve permitir owner remover membro', async () => {
    const ownerToken = await orchestrator.createUserAndToken({
      name: 'Dono',
      birth_day: 1,
      birth_month: 1,
    });
    const memberToken = await orchestrator.createUserAndToken({
      name: 'Membro',
      birth_day: 5,
      birth_month: 5,
    });
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    await orchestrator.joinGroup(memberToken, group.invite_code);

    // Verify auto-birthday event exists for member
    const eventsBeforeRes = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events`,
      { headers: { Authorization: `Bearer ${ownerToken}` } },
    );
    const eventsBefore = await eventsBeforeRes.json();
    const memberBirthdayBefore = eventsBefore.find(
      (e: { title: string }) => e.title === 'Membro',
    );
    expect(memberBirthdayBefore).toBeDefined();

    // Get member's user ID from members list
    const membersRes = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members`,
      { headers: { Authorization: `Bearer ${ownerToken}` } },
    );
    const members = await membersRes.json();
    const memberUserId = members.find(
      (m: { role: string }) => m.role === 'member',
    ).id;

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members/${memberUserId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    expect(response.status).toBe(204);

    // Verify member was removed
    const afterRes = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members`,
      { headers: { Authorization: `Bearer ${ownerToken}` } },
    );
    const afterMembers = await afterRes.json();
    expect(afterMembers.length).toBe(1);

    // Verify auto-birthday event was deleted
    const eventsAfterRes = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events`,
      { headers: { Authorization: `Bearer ${ownerToken}` } },
    );
    const eventsAfter = await eventsAfterRes.json();
    const memberBirthdayAfter = eventsAfter.find(
      (e: { title: string }) => e.title === 'Membro',
    );
    expect(memberBirthdayAfter).toBeUndefined();
  });

  it('deve permitir membro sair do grupo', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const memberToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    await orchestrator.joinGroup(memberToken, group.invite_code);

    // Get member's own user ID
    const membersRes = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members`,
      { headers: { Authorization: `Bearer ${memberToken}` } },
    );
    const members = await membersRes.json();
    const memberUserId = members.find(
      (m: { role: string }) => m.role === 'member',
    ).id;

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members/${memberUserId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${memberToken}` },
      },
    );

    expect(response.status).toBe(204);
  });

  it('deve retornar 400 quando owner tenta sair', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    // Get owner's user ID
    const membersRes = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members`,
      { headers: { Authorization: `Bearer ${ownerToken}` } },
    );
    const members = await membersRes.json();
    const ownerUserId = members[0].id;

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members/${ownerUserId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 401 quando membro tenta remover outro', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const member1Token = await orchestrator.createUserAndToken();
    const member2Token = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    await orchestrator.joinGroup(member1Token, group.invite_code);
    await orchestrator.joinGroup(member2Token, group.invite_code);

    // Get member2's user ID
    const membersRes = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members`,
      { headers: { Authorization: `Bearer ${member1Token}` } },
    );
    const members = await membersRes.json();
    const member2UserId = members.find(
      (m: { role: string; id: string }) =>
        m.role === 'member' && m.id !== members[1]?.id,
    )?.id;

    // member1 tries to remove member2
    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/members/${members[2].id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${member1Token}` },
      },
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });
});
