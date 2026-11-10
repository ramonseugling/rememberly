import database from 'infra/database';
import systemLog from 'models/system-log';

export const LOG_RETENTION_DAYS = 90;
export const LOG_PURGE_BATCH_SIZE = 5000;

const DAY_MS = 24 * 60 * 60 * 1000;

// Purely operational logs. Delivery tables (broadcast, communication, push)
// have their own lifecycle and must never be listed here.
const LOG_TABLES = ['error_logs', 'cron_runs'] as const;
type LogTable = (typeof LOG_TABLES)[number];

export interface PurgeOldLogsInput {
  retentionDays?: number;
  now?: Date;
  batchSize?: number;
}

export interface PurgeOldLogsResult {
  retention_days: number;
  cutoff: string;
  deleted: Record<LogTable, number>;
}

async function purgeTable(
  table: LogTable,
  cutoff: Date,
  batchSize: number,
): Promise<number> {
  let total = 0;
  for (;;) {
    const result = await database.query(
      `DELETE FROM ${table}
       WHERE id IN (
         SELECT id FROM ${table}
         WHERE created_at < $1
         ORDER BY created_at
         LIMIT $2
       )`,
      [cutoff, batchSize],
    );
    const removed = result.rowCount ?? 0;
    total += removed;
    if (removed < batchSize) return total;
  }
}

export async function purgeOldLogs({
  retentionDays = LOG_RETENTION_DAYS,
  now = new Date(),
  batchSize = LOG_PURGE_BATCH_SIZE,
}: PurgeOldLogsInput = {}): Promise<PurgeOldLogsResult> {
  const startTime = Date.now();
  const cutoff = new Date(now.getTime() - retentionDays * DAY_MS);
  const deleted: Record<LogTable, number> = { error_logs: 0, cron_runs: 0 };

  try {
    for (const table of LOG_TABLES) {
      deleted[table] = await purgeTable(table, cutoff, batchSize);
    }
  } catch (error) {
    await systemLog.recordCronRun({
      job_name: 'purge_logs',
      status: 'failed',
      metrics: {
        retention_days: retentionDays,
        cutoff: cutoff.toISOString(),
        ...deleted,
        error: String(error),
      },
      duration_ms: Date.now() - startTime,
    });
    throw error;
  }

  await systemLog.recordCronRun({
    job_name: 'purge_logs',
    status: 'success',
    metrics: {
      retention_days: retentionDays,
      cutoff: cutoff.toISOString(),
      ...deleted,
    },
    duration_ms: Date.now() - startTime,
  });

  return {
    retention_days: retentionDays,
    cutoff: cutoff.toISOString(),
    deleted,
  };
}
