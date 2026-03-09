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

  await fetch('http://localhost:3000/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
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

async function createEventForToday(token: string) {
  const today = new Date();

  const response = await fetch('http://localhost:3000/api/v1/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: faker.person.firstName(),
      type: 'birthday',
      event_day: today.getUTCDate(),
      event_month: today.getUTCMonth() + 1,
    }),
  });

  return response.json();
}

describe('POST /api/v1/notifications/send', () => {
  it('deve retornar 401 sem CRON_SECRET', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send',
      {
        method: 'POST',
      },
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  it('deve retornar 401 com CRON_SECRET inválido', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-invalido',
        },
      },
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  it('deve retornar 200 com sent: 0 quando não há eventos do dia', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.sent).toBe(0);
  });

  it('deve enviar notificação para evento do dia', async () => {
    const { token } = await createUserAndSession();
    await createEventForToday(token);

    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.sent).toBeGreaterThanOrEqual(1);
  });

  it('deve retornar 405 para métodos não permitidos', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send',
      {
        method: 'GET',
      },
    );

    expect(response.status).toBe(405);
  });
});
