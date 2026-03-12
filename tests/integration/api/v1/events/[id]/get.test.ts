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

describe('GET /api/v1/events/[id]', () => {
  it('deve retornar um evento pelo id', async () => {
    const { token } = await createUserAndSession();
    const created = await createEvent(token, {
      title: 'Aniversário do João',
      type: 'birthday',
      event_day: 10,
      event_month: 3,
    });

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.id).toBe(created.id);
    expect(data.title).toBe('Aniversário do João');
    expect(data.type).toBe('birthday');
    expect(data.event_day).toBe(10);
    expect(data.event_month).toBe(3);
  });

  it('deve retornar 404 ao buscar evento de outro usuário', async () => {
    const { token: tokenA } = await createUserAndSession();
    const { token: tokenB } = await createUserAndSession();

    const created = await createEvent(tokenA);

    const response = await fetch(
      `http://localhost:3000/api/v1/events/${created.id}`,
      { headers: { Authorization: `Bearer ${tokenB}` } },
    );

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.name).toBe('NotFoundError');
  });

  it('deve retornar 404 para id inexistente', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch(
      'http://localhost:3000/api/v1/events/00000000-0000-0000-0000-000000000000',
      { headers: { Authorization: `Bearer ${token}` } },
    );

    expect(response.status).toBe(404);
  });

  it('deve retornar 401 quando não autenticado', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/events/qualquer-id',
    );

    expect(response.status).toBe(401);
  });
});
