import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    ALTER TABLE users
      ADD COLUMN terms_accepted_at timestamptz,
      ADD COLUMN terms_version text;
  `);
};

export const down = false;
