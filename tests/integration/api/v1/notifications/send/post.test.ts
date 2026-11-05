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

describe('GET /api/v1/notifications/send', () => {
  it('returns 401 without CRON_SECRET', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send',
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  it('returns 401 with an invalid CRON_SECRET', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send',
      {
        headers: {
          Authorization: 'Bearer token-invalido',
        },
      },
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  it('returns 200 with sent: 0 when there are no events today', async () => {
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
    expect(data.sent).toBe(0);
  });

  it('does not send for an event on a different date', async () => {
    const user = await orchestrator.createUser();
    const tomorrow = new Date(getToday());
    tomorrow.setDate(tomorrow.getDate() + 1);
    await orchestrator.createEvent(user.id, {
      event_day: tomorrow.getDate(),
      event_month: tomorrow.getMonth() + 1,
    });
    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send',
      {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sent: 0 });
  });

  it('returns 405 for disallowed methods', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/notifications/send',
      {
        method: 'POST',
      },
    );

    expect(response.status).toBe(405);
  });
});
