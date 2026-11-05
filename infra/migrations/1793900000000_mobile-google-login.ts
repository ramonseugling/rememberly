import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable('mobile_google_logins', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    oauth_state_hash: { type: 'text', notNull: true, unique: true },
    app_state: { type: 'text', notNull: true },
    code_challenge: { type: 'text', notNull: true },
    code_hash: { type: 'text', unique: true },
    user_id: { type: 'uuid', references: 'users', onDelete: 'CASCADE' },
    expires_at: { type: 'timestamptz', notNull: true },
    completed_at: { type: 'timestamptz' },
    used_at: { type: 'timestamptz' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
  pgm.createIndex('mobile_google_logins', 'expires_at');
};

export const down = false;
