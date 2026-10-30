import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.alterColumn('sessions', 'expires_at', { notNull: false });
};

export const down = false;
