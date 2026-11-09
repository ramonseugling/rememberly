import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`ALTER TABLE gift_lists ADD COLUMN expired_for date;`);
};

export const down = false;
