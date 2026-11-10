import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    ALTER TABLE notification_preferences
      ADD COLUMN push_marketing boolean NOT NULL DEFAULT false;
  `);
};

export const down = false;
