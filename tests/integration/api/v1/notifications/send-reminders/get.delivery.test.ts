import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import { getToday } from 'lib/date-utils';

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

describe('Notification provider delivery', () => {
  it('finds an event with a reminder matching the future date', async () => {
    const cronSecret = process.env.CRON_SECRET;
    expect(cronSecret).toBeTruthy();

    const { token } = await createUserAndSession();

    const today = getToday();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 7);

    await createEvent(token, {
      title: 'Evento com reminder 7 dias',
      event_day: futureDate.getDate(),
      event_month: futureDate.getMonth() + 1,
      reminder_days_before: 7,
    });

    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send-reminders',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cronSecret}` },
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.sent).toBeGreaterThanOrEqual(1);
  });
});
