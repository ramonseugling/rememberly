import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.addColumn('users', { avatar_url: { type: 'text' } });
  pgm.addColumn('groups', { photo_url: { type: 'text' } });
};

export const down = false;
