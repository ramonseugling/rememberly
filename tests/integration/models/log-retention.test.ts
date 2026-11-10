import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import { purgeOldLogs } from 'models/log-retention';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date('2026-06-15T12:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * DAY_MS);

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

beforeEach(async () => {
  await database.query('DELETE FROM error_logs');
  await database.query('DELETE FROM cron_runs');
});

async function insertErrorLog(createdAt: Date, message = 'boom') {
  await database.query(
    `INSERT INTO error_logs (error_name, message, created_at)
     VALUES ('Error', $1, $2)`,
    [message, createdAt],
  );
}

async function insertCronRun(createdAt: Date, jobName = 'some_job') {
  await database.query(
    `INSERT INTO cron_runs (job_name, status, created_at)
     VALUES ($1, 'success', $2)`,
    [jobName, createdAt],
  );
}

async function count(table: 'error_logs' | 'cron_runs' | 'users') {
  const result = await database.query(
    `SELECT COUNT(*)::int AS count FROM ${table}`,
  );
  return result.rows[0].count as number;
}

describe('purgeOldLogs', () => {
  test('deletes rows older than 90 days and keeps newer ones', async () => {
    await insertErrorLog(daysAgo(91), 'old');
    await insertErrorLog(daysAgo(89), 'recent');
    await insertCronRun(daysAgo(120), 'old_job');
    await insertCronRun(daysAgo(10), 'recent_job');

    const result = await purgeOldLogs({ now });

    expect(result.deleted).toEqual({ error_logs: 1, cron_runs: 1 });
    expect(result.retention_days).toBe(90);

    const errors = await database.query('SELECT message FROM error_logs');
    expect(errors.rows).toEqual([{ message: 'recent' }]);
    const runs = await database.query(
      `SELECT job_name FROM cron_runs WHERE job_name <> 'purge_logs'`,
    );
    expect(runs.rows).toEqual([{ job_name: 'recent_job' }]);
  });

  test('keeps rows exactly at the retention boundary', async () => {
    await insertErrorLog(daysAgo(90));

    const result = await purgeOldLogs({ now });

    expect(result.deleted.error_logs).toBe(0);
    expect(await count('error_logs')).toBe(1);
  });

  test('honours a custom retentionDays', async () => {
    await insertErrorLog(daysAgo(40));
    await insertErrorLog(daysAgo(10));

    const result = await purgeOldLogs({ retentionDays: 30, now });

    expect(result.deleted.error_logs).toBe(1);
    expect(await count('error_logs')).toBe(1);
  });

  test('deletes across several batches', async () => {
    for (let i = 0; i < 7; i++) {
      await insertErrorLog(daysAgo(100 + i));
    }
    await insertErrorLog(daysAgo(1));

    const result = await purgeOldLogs({ now, batchSize: 3 });

    expect(result.deleted.error_logs).toBe(7);
    expect(await count('error_logs')).toBe(1);
  });

  test('records itself as a purge_logs cron run', async () => {
    await insertErrorLog(daysAgo(100));

    await purgeOldLogs({ now });

    const runs = await database.query(
      `SELECT status, metrics FROM cron_runs WHERE job_name = 'purge_logs'`,
    );
    expect(runs.rows).toHaveLength(1);
    expect(runs.rows[0].status).toBe('success');
    expect(runs.rows[0].metrics.error_logs).toBe(1);
  });

  test('does not touch other tables', async () => {
    await orchestrator.createUser();
    const before = await count('users');

    await purgeOldLogs({ now });

    expect(await count('users')).toBe(before);
  });
});
