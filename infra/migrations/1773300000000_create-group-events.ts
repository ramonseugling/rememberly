import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable('group_events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    group_id: {
      type: 'uuid',
      notNull: true,
      references: 'groups(id)',
      onDelete: 'CASCADE',
    },
    title: {
      type: 'text',
      notNull: true,
    },
    type: {
      type: 'text',
      notNull: true,
    },
    custom_type: {
      type: 'text',
      notNull: false,
    },
    event_day: {
      type: 'smallint',
      notNull: true,
    },
    event_month: {
      type: 'smallint',
      notNull: true,
    },
    created_by: {
      type: 'uuid',
      notNull: false,
      references: 'users(id)',
      onDelete: 'SET NULL',
    },
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

  pgm.addConstraint(
    'group_events',
    'group_events_type_check',
    `CHECK (type IN ('birthday', 'dating_anniversary', 'wedding_anniversary', 'celebration', 'custom'))`,
  );

  pgm.addConstraint(
    'group_events',
    'group_events_event_day_check',
    'CHECK (event_day >= 1 AND event_day <= 31)',
  );

  pgm.addConstraint(
    'group_events',
    'group_events_event_month_check',
    'CHECK (event_month >= 1 AND event_month <= 12)',
  );

  pgm.createIndex('group_events', 'group_id');
  pgm.createIndex('group_events', ['event_day', 'event_month']);
};

export const down = false;
