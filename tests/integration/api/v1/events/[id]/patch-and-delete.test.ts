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
  it('updates the event title', async () => {
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

  it('updates the event type', async () => {
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

  it('updates the event day and month', async () => {
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

  it('returns 400 when updating with an invalid type', async () => {
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

  it('returns 400 when updating without fields', async () => {
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

  it('returns 404 when updating another user event', async () => {
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

  it('returns 401 when not authenticated', async () => {
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

  it('updates an event to the custom type with custom_type', async () => {
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

  it('clears custom_type when changing from custom to a fixed type', async () => {
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

  it('returns 400 when changing to custom without custom_type', async () => {
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

  it('updates reminder_days_before', async () => {
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

  it('returns 400 when updating reminder_days_before with an invalid value', async () => {
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
  it('deletes an existing event', async () => {
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

  it('returns 404 when deleting another user event', async () => {
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

  it('returns 401 when not authenticated', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/events/qualquer-id',
      { method: 'DELETE' },
    );

    expect(response.status).toBe(401);
  });
});
