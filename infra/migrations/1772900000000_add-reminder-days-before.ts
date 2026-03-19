import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.addColumn('events', {
    reminder_days_before: {
      type: 'smallint',
      notNull: true,
      default: 0,
    },
  });

  pgm.addConstraint(
    'events',
    'events_reminder_days_before_check',
    `CHECK (reminder_days_before IN (0, 1, 3, 7, 15, 30))`,
  );
};

export const down = false;
