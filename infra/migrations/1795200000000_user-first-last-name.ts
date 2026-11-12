import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN first_name text;
    ALTER TABLE users ADD COLUMN last_name text;

    UPDATE users
    SET first_name = split_part(btrim(name), ' ', 1),
        last_name = NULLIF(
          btrim(substr(btrim(name), length(split_part(btrim(name), ' ', 1)) + 1)),
          ''
        );
  `);
};

export const down = false;
