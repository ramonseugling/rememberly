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

describe('GET /api/v1/events', () => {
  it('deve retornar lista vazia quando usuário não tem eventos', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.events).toEqual([]);
  });

  it('deve retornar os eventos do usuário', async () => {
    const { token } = await createUserAndSession();

    await createEvent(token, { title: 'Evento 1', event_month: 3 });
    await createEvent(token, { title: 'Evento 2', event_month: 7 });

    const response = await fetch('http://localhost:3000/api/v1/events', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.events).toHaveLength(2);
    expect(data.events[0].title).toBe('Evento 1');
    expect(data.events[1].title).toBe('Evento 2');
  });

  it('deve retornar apenas os eventos do próprio usuário', async () => {
    const { token: tokenA } = await createUserAndSession();
    const { token: tokenB } = await createUserAndSession();

    await createEvent(tokenA, { title: 'Evento do usuário A' });
    await createEvent(tokenB, { title: 'Evento do usuário B' });

    const responseA = await fetch('http://localhost:3000/api/v1/events', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const dataA = await responseA.json();
    expect(
      dataA.events.some(
        (e: { title: string }) => e.title === 'Evento do usuário A',
      ),
    ).toBe(true);
    expect(
      dataA.events.some(
        (e: { title: string }) => e.title === 'Evento do usuário B',
      ),
    ).toBe(false);
  });

  it('deve retornar todos os eventos criados', async () => {
    const { token } = await createUserAndSession();

    await createEvent(token, {
      title: 'Dezembro',
      event_month: 12,
      event_day: 1,
    });
    await createEvent(token, {
      title: 'Janeiro',
      event_month: 1,
      event_day: 15,
    });
    await createEvent(token, {
      title: 'Janeiro cedo',
      event_month: 1,
      event_day: 5,
    });

    const response = await fetch('http://localhost:3000/api/v1/events', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    expect(data.events).toHaveLength(3);
    const titles = data.events.map((e: { title: string }) => e.title);
    expect(titles).toContain('Dezembro');
    expect(titles).toContain('Janeiro');
    expect(titles).toContain('Janeiro cedo');
  });

  it('deve retornar 401 quando não autenticado', async () => {
    const response = await fetch('http://localhost:3000/api/v1/events');

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });
});
