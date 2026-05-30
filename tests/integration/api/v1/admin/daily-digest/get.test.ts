import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/admin/daily-digest', () => {
  test('returns 401 without CRON_SECRET', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/admin/daily-digest',
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  test('returns 401 with an invalid CRON_SECRET', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/admin/daily-digest',
      { headers: { Authorization: 'Bearer token-invalido' } },
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  test('returns 405 for disallowed methods', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/admin/daily-digest',
      { method: 'POST' },
    );

    expect(response.status).toBe(405);
  });

  test('returns skipped: no_recipients when DIGEST_RECIPIENTS is not configured', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/admin/daily-digest',
      {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    if (process.env.DIGEST_RECIPIENTS) {
      expect(data.sent).toBe(true);
      expect(typeof data.recipients).toBe('number');
      expect(typeof data.dateLabel).toBe('string');
    } else {
      expect(data.skipped).toBe('no_recipients');
      expect(typeof data.dateLabel).toBe('string');
    }
  });
});
