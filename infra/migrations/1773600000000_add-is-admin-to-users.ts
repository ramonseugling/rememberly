import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.addColumn('users', {
    is_admin: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
  });
};

export const down = false;
