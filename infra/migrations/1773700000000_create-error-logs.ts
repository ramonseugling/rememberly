import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable('error_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    error_name: {
      type: 'text',
      notNull: true,
    },
    message: {
      type: 'text',
      notNull: true,
    },
    stack: {
      type: 'text',
    },
    request_method: {
      type: 'text',
    },
    request_path: {
      type: 'text',
    },
    user_id: {
      type: 'uuid',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('error_logs', 'created_at');
};

export const down = false;
