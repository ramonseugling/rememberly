import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/notifications/purge-logs', () => {
  const url = 'http://localhost:3000/api/v1/notifications/purge-logs';

  it('returns 401 without CRON_SECRET', async () => {
    const response = await fetch(url, { method: 'GET' });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  it('returns 401 with an invalid CRON_SECRET', async () => {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: 'Bearer token-invalido' },
    });

    expect(response.status).toBe(401);
  });

  it('returns 200 and purges old logs with a valid CRON_SECRET', async () => {
    const cronSecret = process.env.CRON_SECRET;
    expect(cronSecret).toBeTruthy();
    await database.query(
      `INSERT INTO error_logs (error_name, message, created_at)
       VALUES ('Error', 'old', now() - interval '100 days')`,
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.deleted.error_logs).toBeGreaterThanOrEqual(1);
    const left = await database.query(
      `SELECT COUNT(*)::int AS count FROM error_logs WHERE message = 'old'`,
    );
    expect(left.rows[0].count).toBe(0);
  });

  it('returns 405 for POST', async () => {
    const response = await fetch(url, { method: 'POST' });

    expect(response.status).toBe(405);
  });
});
