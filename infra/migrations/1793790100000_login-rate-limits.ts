import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable('login_rate_limits', {
    bucket_id: { type: 'text', primaryKey: true },
    scope: { type: 'text', notNull: true },
    attempts: { type: 'integer', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
  });
  pgm.addConstraint(
    'login_rate_limits',
    'login_rate_limits_scope_check',
    "CHECK (scope IN ('email', 'ip'))",
  );
  pgm.addConstraint(
    'login_rate_limits',
    'login_rate_limits_attempts_check',
    'CHECK (attempts > 0)',
  );
  pgm.createIndex('login_rate_limits', 'expires_at');
};

export const down = false;
