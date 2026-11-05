import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import { getToday } from 'lib/date-utils';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

beforeEach(async () => {
  await database.query('TRUNCATE users, cron_runs CASCADE');
});

afterEach(async () => {
  // Zero sends alone could conceal caught delivery failures; no mailer candidate may be selected.
  const runs = await database.query('SELECT status, metrics FROM cron_runs');
  for (const run of runs.rows) {
    expect(run).toMatchObject({
      status: 'success',
      metrics: { sent: 0, failed: 0 },
    });
  }
  const candidates = await database.query(
    `SELECT metrics FROM cron_runs WHERE job_name IN ('notifications_send', 'notifications_reminders')`,
  );
  for (const run of candidates.rows) {
    expect(run.metrics.total).toBe(0);
  }
});

describe('GET /api/v1/notifications/send-reminders', () => {
  it('returns 401 without CRON_SECRET', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send-reminders',
      { method: 'GET' },
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  it('returns 401 with an invalid CRON_SECRET', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send-reminders',
      {
        method: 'GET',
        headers: { Authorization: 'Bearer token-invalido' },
      },
    );

    expect(response.status).toBe(401);
  });

  it('returns 200 with a valid CRON_SECRET', async () => {
    const cronSecret = process.env.CRON_SECRET;
    expect(cronSecret).toBeTruthy();

    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send-reminders',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cronSecret}` },
      },
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('sent');
    expect(typeof data.sent).toBe('number');
  });

  it('returns sent: 0 when there are no events with a reminder for today', async () => {
    const cronSecret = process.env.CRON_SECRET;
    expect(cronSecret).toBeTruthy();

    const user = await orchestrator.createUser();

    await orchestrator.createEvent(user.id, {
      title: 'Sem reminder',
      event_day: 1,
      event_month: 1,
      reminder_days_before: 0,
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
    expect(data.sent).toBe(0);
  });

  it('does not send a reminder when reminder_days_before does not match the date', async () => {
    const cronSecret = process.env.CRON_SECRET;
    expect(cronSecret).toBeTruthy();

    const user = await orchestrator.createUser();

    const today = getToday();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 7);

    // Event is 7 days away but reminder is set to 3 days — should NOT trigger
    await orchestrator.createEvent(user.id, {
      title: 'Reminder não deve disparar',
      event_day: futureDate.getDate(),
      event_month: futureDate.getMonth() + 1,
      reminder_days_before: 3,
    });

    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send-reminders',
      {
        headers: { Authorization: `Bearer ${cronSecret}` },
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sent: 0,
      reminders: { sent: 0 },
      commemorative: { sent: 0 },
    });
  });
});
