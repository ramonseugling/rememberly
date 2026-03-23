import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/groups/[id]/events', () => {
  it('deve criar evento no grupo', async () => {
    const token = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(token, 'Família');

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Aniversário do Pedro',
          type: 'birthday',
          event_day: 20,
          event_month: 5,
        }),
      },
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe('Aniversário do Pedro');
    expect(data.type).toBe('birthday');
    expect(data.event_day).toBe(20);
    expect(data.event_month).toBe(5);
    expect(data.group_id).toBe(group.id);
  });

  it('deve criar evento a partir de evento pessoal existente', async () => {
    const token = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(token, 'Família');

    // Create personal event first
    const personalRes = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Aniversário da Ana',
        type: 'birthday',
        event_day: 10,
        event_month: 8,
      }),
    });
    const personalEvent = await personalRes.json();

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ source_event_id: personalEvent.id }),
      },
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.title).toBe('Aniversário da Ana');
    expect(data.type).toBe('birthday');
    expect(data.event_day).toBe(10);
    expect(data.event_month).toBe(8);
  });

  it('deve retornar 400 com dados inválidos', async () => {
    const token = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(token, 'Grupo');

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Evento',
          type: 'birthday',
          event_day: 32,
          event_month: 6,
        }),
      },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 404 quando não é membro', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const otherToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Privado');

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherToken}`,
        },
        body: JSON.stringify({
          title: 'Evento',
          type: 'birthday',
          event_day: 15,
          event_month: 6,
        }),
      },
    );

    expect(response.status).toBe(404);
  });

  it('membro comum deve poder criar evento', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const memberToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    await orchestrator.joinGroup(memberToken, group.invite_code);

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          title: 'Evento do Membro',
          type: 'celebration',
          event_day: 1,
          event_month: 1,
        }),
      },
    );

    expect(response.status).toBe(201);
  });
});

describe('GET /api/v1/groups/[id]/events', () => {
  it('deve listar eventos do grupo incluindo aniversários auto-criados', async () => {
    const ownerToken = await orchestrator.createUserAndToken({
      name: 'Maria',
      birth_day: 15,
      birth_month: 3,
    });
    const group = await orchestrator.createGroup(ownerToken, 'Família');

    await orchestrator.createGroupEvent(ownerToken, group.id, {
      title: 'Aniversário do Pedro',
      type: 'birthday',
      event_day: 20,
      event_month: 5,
    });

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    // Owner's auto-created birthday (day 15, month 3) + manually created event (day 20, month 5)
    expect(data.length).toBe(2);

    // Sorted by month ASC, day ASC — auto birthday (March 15) comes first
    expect(data[0].title).toBe('Maria');
    expect(data[0].event_day).toBe(15);
    expect(data[0].event_month).toBe(3);
    expect(data[0].type).toBe('birthday');

    expect(data[1].title).toBe('Aniversário do Pedro');
    expect(data[1].event_day).toBe(20);
    expect(data[1].event_month).toBe(5);
  });

  it('deve incluir aniversário de novo membro ao entrar no grupo', async () => {
    const ownerToken = await orchestrator.createUserAndToken({
      name: 'Ana',
      birth_day: 10,
      birth_month: 6,
    });
    const memberToken = await orchestrator.createUserAndToken({
      name: 'Carlos',
      birth_day: 25,
      birth_month: 12,
    });
    const group = await orchestrator.createGroup(ownerToken, 'Amigos');

    // Before join: only owner's auto-birthday
    const beforeRes = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events`,
      { headers: { Authorization: `Bearer ${ownerToken}` } },
    );
    const beforeData = await beforeRes.json();
    expect(beforeData.length).toBe(1);
    expect(beforeData[0].title).toBe('Ana');

    // Join
    await orchestrator.joinGroup(memberToken, group.invite_code);

    // After join: owner + member auto-birthdays
    const afterRes = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events`,
      { headers: { Authorization: `Bearer ${ownerToken}` } },
    );
    const afterData = await afterRes.json();
    expect(afterData.length).toBe(2);

    const titles = afterData.map((e: { title: string }) => e.title);
    expect(titles).toContain('Ana');
    expect(titles).toContain('Carlos');
  });
});

describe('PATCH /api/v1/groups/[id]/events/[eventId]', () => {
  it('membro deve poder editar evento', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const memberToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    await orchestrator.joinGroup(memberToken, group.invite_code);

    const event = await orchestrator.createGroupEvent(ownerToken, group.id, {
      title: 'Original',
    });

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events/${event.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ title: 'Atualizado pelo membro' }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.title).toBe('Atualizado pelo membro');
  });
});

describe('DELETE /api/v1/groups/[id]/events/[eventId]', () => {
  it('owner deve poder deletar evento', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');
    const event = await orchestrator.createGroupEvent(ownerToken, group.id);

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events/${event.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    expect(response.status).toBe(204);
  });

  it('membro deve receber 401 ao tentar deletar', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const memberToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Grupo');

    await orchestrator.joinGroup(memberToken, group.invite_code);

    const event = await orchestrator.createGroupEvent(ownerToken, group.id);

    const response = await fetch(
      `http://localhost:3000/api/v1/groups/${group.id}/events/${event.id}`,
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
