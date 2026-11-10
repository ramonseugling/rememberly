import { faker } from '@faker-js/faker';
import orchestrator from 'tests/orchestrator';
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
    body: JSON.stringify({
      ...userData,
      accepted_terms: true,
      otp_code: otpRecord.code,
    }),
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
  const today = getToday();

  const response = await fetch('http://localhost:3000/api/v1/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: faker.person.firstName(),
      type: 'birthday',
      event_day: today.getDate(),
      event_month: today.getMonth() + 1,
    }),
  });

  return response.json();
}

describe('Notification provider delivery', () => {
  it('sends a notification for an event today', async () => {
    const { token } = await createUserAndSession();
    await createEventForToday(token);

    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send',
      {
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.sent).toBeGreaterThanOrEqual(1);
  });
});
