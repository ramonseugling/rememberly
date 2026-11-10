import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`ALTER TABLE gift_items ADD COLUMN photo_url text;`);
};

export const down = false;
