import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import systemLog from 'models/system-log';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('systemLog.recordError', () => {
  test('insere row em error_logs com campos corretos', async () => {
    const before = await database.query(
      'SELECT COUNT(*)::int AS count FROM error_logs',
    );
    const err = new TypeError('boom');

    await systemLog.recordError({
      error: err,
      request_method: 'POST',
      request_path: '/api/v1/teste',
      user_id: null,
    });

    const after = await database.query(
      `SELECT error_name, message, request_method, request_path
       FROM error_logs
       ORDER BY created_at DESC
       LIMIT 1`,
    );

    expect(after.rows.length).toBe(1);
    expect(after.rows[0].error_name).toBe('TypeError');
    expect(after.rows[0].message).toBe('boom');
    expect(after.rows[0].request_method).toBe('POST');
    expect(after.rows[0].request_path).toBe('/api/v1/teste');

    const countAfter = await database.query(
      'SELECT COUNT(*)::int AS count FROM error_logs',
    );
    expect(countAfter.rows[0].count).toBe(before.rows[0].count + 1);
  });

  test('lida com erro como string', async () => {
    await systemLog.recordError({ error: 'algo deu errado' });

    const result = await database.query(
      `SELECT error_name, message
       FROM error_logs
       ORDER BY created_at DESC
       LIMIT 1`,
    );
    expect(result.rows[0].error_name).toBe('Error');
    expect(result.rows[0].message).toBe('algo deu errado');
  });
});

describe('systemLog.recordCronRun', () => {
  test('insere row em cron_runs com metrics serializadas', async () => {
    await systemLog.recordCronRun({
      job_name: 'test_job',
      status: 'success',
      metrics: { sent: 3, failed: 0 },
      duration_ms: 42,
    });

    const result = await database.query(
      `SELECT job_name, status, metrics, duration_ms
       FROM cron_runs
       WHERE job_name = 'test_job'
       ORDER BY created_at DESC
       LIMIT 1`,
    );

    expect(result.rows[0].status).toBe('success');
    expect(result.rows[0].metrics).toEqual({ sent: 3, failed: 0 });
    expect(result.rows[0].duration_ms).toBe(42);
  });
});

describe('systemLog queries de janela', () => {
  test('countSignupsBetween soma cadastros e separa Google vs senha', async () => {
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();

    await database.query(
      `INSERT INTO users (name, email, password, created_at)
       VALUES ('A', 'a@example.com', NULL, NOW() - INTERVAL '5 hours')`,
    );
    await database.query(
      `INSERT INTO users (name, email, password, created_at)
       VALUES ('B', 'b@example.com', 'hash', NOW() - INTERVAL '3 hours'),
              ('C', 'c@example.com', 'hash', NOW() - INTERVAL '1 hour')`,
    );

    const start = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const end = new Date(Date.now() + 1000 * 60);

    const result = await systemLog.countSignupsBetween(start, end);
    expect(result.total).toBe(3);
    expect(result.viaGoogle).toBe(1);
    expect(result.viaPassword).toBe(2);
  });

  test('countEventsCreatedBetween retorna total + breakdown por tipo', async () => {
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();

    const user = await orchestrator.createUser();
    await orchestrator.createEvent(user.id, { type: 'birthday' });
    await orchestrator.createEvent(user.id, { type: 'birthday' });
    await orchestrator.createEvent(user.id, { type: 'wedding_anniversary' });

    const start = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const end = new Date(Date.now() + 1000 * 60);
    const result = await systemLog.countEventsCreatedBetween(start, end);

    expect(result.total).toBe(3);
    const types = Object.fromEntries(
      result.byType.map((r) => [r.type, r.count]),
    );
    expect(types['birthday']).toBe(2);
    expect(types['wedding_anniversary']).toBe(1);
  });

  test('countErrorsBetween retorna total e top 5 por error_name', async () => {
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();

    await systemLog.recordError({ error: new TypeError('a') });
    await systemLog.recordError({ error: new TypeError('b') });
    await systemLog.recordError({ error: new RangeError('c') });

    const start = new Date(Date.now() - 1000 * 60 * 60);
    const end = new Date(Date.now() + 1000 * 60);
    const result = await systemLog.countErrorsBetween(start, end);

    expect(result.total).toBe(3);
    const counts = Object.fromEntries(
      result.topByName.map((r) => [r.error_name, r.count]),
    );
    expect(counts['TypeError']).toBe(2);
    expect(counts['RangeError']).toBe(1);
  });

  test('getCurrentTotals retorna contagens atuais', async () => {
    await orchestrator.clearDatabase();
    await orchestrator.runPendingMigrations();

    const u1 = await orchestrator.createUser();
    await orchestrator.createUser();
    await orchestrator.createEvent(u1.id, { type: 'birthday' });

    const totals = await systemLog.getCurrentTotals();
    expect(totals.users).toBe(2);
    expect(totals.events).toBe(1);
    expect(totals.groups).toBe(0);
  });
});
