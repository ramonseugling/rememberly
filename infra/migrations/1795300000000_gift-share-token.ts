import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    ALTER TABLE gift_lists ADD COLUMN share_token text UNIQUE;
    ALTER TABLE gift_reservations
      ADD COLUMN via_link boolean NOT NULL DEFAULT false;
  `);
};

export const down = false;
