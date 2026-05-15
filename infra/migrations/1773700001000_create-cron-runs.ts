import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable('cron_runs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    job_name: {
      type: 'text',
      notNull: true,
    },
    status: {
      type: 'text',
      notNull: true,
    },
    metrics: {
      type: 'jsonb',
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    duration_ms: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('cron_runs', 'created_at');
  pgm.createIndex('cron_runs', 'job_name');
};

export const down = false;
