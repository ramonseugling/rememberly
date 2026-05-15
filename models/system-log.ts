import database from 'infra/database';

interface RecordErrorInput {
  error: unknown;
  request_method?: string | null;
  request_path?: string | null;
  user_id?: string | null;
}

async function recordError(input: RecordErrorInput): Promise<void> {
  const err = input.error;
  const error_name =
    err instanceof Error
      ? err.name
      : typeof err === 'string'
        ? 'Error'
        : 'UnknownError';
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : String(err);
  const stack = err instanceof Error ? (err.stack ?? null) : null;

  try {
    await database.query(
      `INSERT INTO error_logs
         (error_name, message, stack, request_method, request_path, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        error_name,
        message,
        stack,
        input.request_method ?? null,
        input.request_path ?? null,
        input.user_id ?? null,
      ],
    );
  } catch {}
}

export type CronStatus = 'success' | 'partial' | 'failed';

interface RecordCronRunInput {
  job_name: string;
  status: CronStatus;
  metrics: Record<string, unknown>;
  duration_ms: number;
}

async function recordCronRun(input: RecordCronRunInput): Promise<void> {
  try {
    await database.query(
      `INSERT INTO cron_runs (job_name, status, metrics, duration_ms)
       VALUES ($1, $2, $3::jsonb, $4)`,
      [
        input.job_name,
        input.status,
        JSON.stringify(input.metrics),
        Math.max(0, Math.round(input.duration_ms)),
      ],
    );
  } catch {}
}

interface SignupCounts {
  total: number;
  viaGoogle: number;
  viaPassword: number;
}

async function countSignupsBetween(
  start: Date,
  end: Date,
): Promise<SignupCounts> {
  const result = await database.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE password IS NULL)::int AS via_google,
       COUNT(*) FILTER (WHERE password IS NOT NULL)::int AS via_password
     FROM users
     WHERE created_at >= $1 AND created_at < $2`,
    [start, end],
  );
  const row = result.rows[0];
  return {
    total: row.total ?? 0,
    viaGoogle: row.via_google ?? 0,
    viaPassword: row.via_password ?? 0,
  };
}

async function countLoginsBetween(start: Date, end: Date): Promise<number> {
  const result = await database.query(
    `SELECT COUNT(*)::int AS count
     FROM sessions
     WHERE created_at >= $1 AND created_at < $2`,
    [start, end],
  );
  return result.rows[0]?.count ?? 0;
}

interface EventsCreated {
  total: number;
  byType: { type: string; count: number }[];
}

async function countEventsCreatedBetween(
  start: Date,
  end: Date,
): Promise<EventsCreated> {
  const result = await database.query(
    `SELECT type, COUNT(*)::int AS count
     FROM events
     WHERE created_at >= $1 AND created_at < $2
     GROUP BY type
     ORDER BY count DESC`,
    [start, end],
  );
  const rows = result.rows as { type: string; count: number }[];
  const total = rows.reduce((acc, r) => acc + r.count, 0);
  return { total, byType: rows };
}

interface ErrorBreakdown {
  total: number;
  topByName: { error_name: string; count: number }[];
}

async function countErrorsBetween(
  start: Date,
  end: Date,
): Promise<ErrorBreakdown> {
  const [totalResult, topResult] = await Promise.all([
    database.query(
      `SELECT COUNT(*)::int AS count
       FROM error_logs
       WHERE created_at >= $1 AND created_at < $2`,
      [start, end],
    ),
    database.query(
      `SELECT error_name, COUNT(*)::int AS count
       FROM error_logs
       WHERE created_at >= $1 AND created_at < $2
       GROUP BY error_name
       ORDER BY count DESC
       LIMIT 5`,
      [start, end],
    ),
  ]);
  return {
    total: totalResult.rows[0]?.count ?? 0,
    topByName: topResult.rows,
  };
}

export interface CronRunRow {
  job_name: string;
  status: CronStatus;
  metrics: Record<string, unknown>;
  duration_ms: number;
  created_at: Date;
}

async function getCronRunsBetween(
  start: Date,
  end: Date,
): Promise<CronRunRow[]> {
  const result = await database.query(
    `SELECT job_name, status, metrics, duration_ms, created_at
     FROM cron_runs
     WHERE created_at >= $1 AND created_at < $2
     ORDER BY created_at ASC`,
    [start, end],
  );
  return result.rows;
}

interface CurrentTotals {
  users: number;
  events: number;
  groups: number;
}

async function getCurrentTotals(): Promise<CurrentTotals> {
  const result = await database.query(`
    SELECT
      (SELECT COUNT(*) FROM users)::int AS users,
      (SELECT COUNT(*) FROM events)::int AS events,
      (SELECT COUNT(*) FROM groups)::int AS groups
  `);
  const row = result.rows[0];
  return {
    users: row?.users ?? 0,
    events: row?.events ?? 0,
    groups: row?.groups ?? 0,
  };
}

const systemLog = {
  recordError,
  recordCronRun,
  countSignupsBetween,
  countLoginsBetween,
  countEventsCreatedBetween,
  countErrorsBetween,
  getCronRunsBetween,
  getCurrentTotals,
};

export default systemLog;
