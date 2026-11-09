import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`DROP TABLE IF EXISTS gift_list_groups;`);
};

export const down = false;
