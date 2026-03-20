import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createUserAndSession() {
  const userData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'senha123',
    birth_day: faker.number.int({ min: 1, max: 28 }),
    birth_month: faker.number.int({ min: 1, max: 12 }),
    birth_year: faker.number.int({ min: 1950, max: 2005 }),
  };

  const otpRecord = await orchestrator.createValidOtp(userData.email);

  await fetch('http://localhost:3000/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userData, otp_code: otpRecord.code }),
  });

  const sessionResponse = await fetch('http://localhost:3000/api/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
    }),
  });

  const setCookie = sessionResponse.headers.get('set-cookie') ?? '';
  const token = setCookie.match(/session_token=([^;]+)/)?.[1] ?? '';

  return { userData, token };
}

async function createEvent(
  token: string,
  overrides: Record<string, unknown> = {},
) {
  const response = await fetch('http://localhost:3000/api/v1/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: faker.lorem.words(2),
      type: 'birthday',
      event_day: faker.number.int({ min: 1, max: 28 }),
      event_month: faker.number.int({ min: 1, max: 12 }),
      ...overrides,
    }),
  });

  return response.json();
}

describe('PATCH /api/v1/events/[id]', () => {
  it('deve atualizar o título do evento', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token, { title: 'Título original' });

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'Título atualizado' }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.title).toBe('Título atualizado');
    expect(data.id).toBe(created.id);
  });

  it('deve atualizar o tipo do evento', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token, { type: 'birthday' });

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'celebration' }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.type).toBe('celebration');
  });

  it('deve atualizar dia e mês do evento', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token, { event_day: 1, event_month: 1 });

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_day: 25, event_month: 12 }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.event_day).toBe(25);
    expect(data.event_month).toBe(12);
  });

  it('deve retornar 400 ao tentar atualizar com type inválido', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token);

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'invalido' }),
      },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 400 ao tentar atualizar sem campos', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token);

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve retornar 404 ao tentar atualizar evento de outro usuário', async () => {
    const { token: tokenA } = await createUserAndSession();
    const { token: tokenB } = await createUserAndSession();

    const created = await createEvent(tokenA);

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ title: 'Tentativa' }),
      },
    );

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.name).toBe('NotFoundError');
  });

  it('deve retornar 401 quando não autenticado', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/events/qualquer-id',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Teste' }),
      },
    );

    expect(response.status).toBe(401);
  });

  it('deve atualizar evento para tipo custom com custom_type', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token, { type: 'birthday' });

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'custom', custom_type: 'Formatura' }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.type).toBe('custom');
    expect(data.custom_type).toBe('Formatura');
  });

  it('deve limpar custom_type ao mudar de custom para tipo fixo', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token, {
      type: 'custom',
      custom_type: 'Formatura',
    });

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'birthday' }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.type).toBe('birthday');
    expect(data.custom_type).toBeNull();
  });

  it('deve retornar 400 ao mudar para custom sem custom_type', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token, { type: 'birthday' });

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'custom' }),
      },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('deve atualizar reminder_days_before', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token, { reminder_days_before: 0 });

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reminder_days_before: 7 }),
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.reminder_days_before).toBe(7);
  });

  it('deve retornar 400 ao atualizar reminder_days_before com valor inválido', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token);

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reminder_days_before: 5 }),
      },
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });
});

describe('DELETE /api/v1/events/[id]', () => {
  it('deve deletar um evento existente', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token);

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(response.status).toBe(204);

    const getResponse = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(getResponse.status).toBe(404);
  });

  it('deve retornar 404 ao tentar deletar evento de outro usuário', async () => {
    const { token: tokenA } = await createUserAndSession();
    const { token: tokenB } = await createUserAndSession();

    const created = await createEvent(tokenA);

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` },
      },
    );

    expect(response.status).toBe(404);
  });

  it('deve retornar 401 quando não autenticado', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/events/qualquer-id',
      { method: 'DELETE' },
    );

    expect(response.status).toBe(401);
  });
});
