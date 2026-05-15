import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/admin/daily-digest', () => {
  test('deve retornar 401 sem CRON_SECRET', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/admin/daily-digest',
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  test('deve retornar 401 com CRON_SECRET inválido', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/admin/daily-digest',
      { headers: { Authorization: 'Bearer token-invalido' } },
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.name).toBe('UnauthorizedError');
  });

  test('deve retornar 405 para métodos não permitidos', async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/admin/daily-digest',
      { method: 'POST' },
    );

    expect(response.status).toBe(405);
  });

  test('deve retornar skipped: no_recipients quando DIGEST_RECIPIENTS não está configurada', async () => {
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
