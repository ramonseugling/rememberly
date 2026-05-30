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

describe('POST /api/v1/events', () => {
  it('creates an event with valid data', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Aniversário da Maria',
        type: 'birthday',
        event_day: 15,
        event_month: 6,
      }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe('Aniversário da Maria');
    expect(data.type).toBe('birthday');
    expect(data.event_day).toBe(15);
    expect(data.event_month).toBe(6);
    expect(data.user_id).toBeDefined();
    expect(data.created_at).toBeDefined();
  });

  it('creates an event with all valid types', async () => {
    const { token } = await createUserAndSession();
    const types = [
      'birthday',
      'dating_anniversary',
      'wedding_anniversary',
      'celebration',
    ];

    for (const type of types) {
      const response = await fetch('http://localhost:3000/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `Evento ${type}`,
          type,
          event_day: 1,
          event_month: 1,
        }),
      });

      expect(response.status).toBe(201);
    }

    const customResponse = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Evento custom',
        type: 'custom',
        custom_type: 'Tipo personalizado',
        event_day: 1,
        event_month: 1,
      }),
    });

    expect(customResponse.status).toBe(201);
  });

  it('returns 400 when the title is missing', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'birthday',
        event_day: 15,
        event_month: 6,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('returns 400 when the type is invalid', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Evento',
        type: 'tipo_invalido',
        event_day: 15,
        event_month: 6,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('returns 400 when event_day is invalid', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
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
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('returns 400 when event_month is invalid', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Evento',
        type: 'birthday',
        event_day: 15,
        event_month: 13,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('returns 401 when not authenticated', async () => {
    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Evento',
        type: 'birthday',
        event_day: 15,
        event_month: 6,
      }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  it('creates an event with the custom type and custom_type', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Formatura da faculdade',
        type: 'custom',
        custom_type: 'Formatura',
        event_day: 20,
        event_month: 12,
      }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.type).toBe('custom');
    expect(data.custom_type).toBe('Formatura');
  });

  it('returns 400 when type is custom without custom_type', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Evento custom',
        type: 'custom',
        event_day: 10,
        event_month: 5,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });

  it('ignores custom_type when type is not custom', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Aniversário',
        type: 'birthday',
        custom_type: 'Deveria ser ignorado',
        event_day: 15,
        event_month: 6,
      }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.type).toBe('birthday');
    expect(data.custom_type).toBeNull();
  });

  it('creates an event with reminder_days_before', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Aniversário da Ana',
        type: 'birthday',
        event_day: 10,
        event_month: 7,
        reminder_days_before: 7,
      }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.reminder_days_before).toBe(7);
  });

  it('uses the default reminder_days_before of 0 when not provided', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Sem lembrete',
        type: 'birthday',
        event_day: 5,
        event_month: 3,
      }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.reminder_days_before).toBe(0);
  });

  it('returns 400 when reminder_days_before is invalid', async () => {
    const { token } = await createUserAndSession();

    const response = await fetch('http://localhost:3000/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Evento',
        type: 'birthday',
        event_day: 15,
        event_month: 6,
        reminder_days_before: 10,
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.name).toBe('ValidationError');
  });
});
