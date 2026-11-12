import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    ALTER TABLE otp_tokens ADD COLUMN purpose text NOT NULL DEFAULT 'signup';
  `);
};

export const down = false;
