import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.addColumn('users', {
    birth_day: {
      type: 'smallint',
      notNull: false,
    },
    birth_month: {
      type: 'smallint',
      notNull: false,
    },
    birth_year: {
      type: 'smallint',
      notNull: false,
    },
  });

  pgm.addConstraint(
    'users',
    'users_birth_day_check',
    `CHECK (birth_day >= 1 AND birth_day <= 31)`,
  );

  pgm.addConstraint(
    'users',
    'users_birth_month_check',
    `CHECK (birth_month >= 1 AND birth_month <= 12)`,
  );

  pgm.addConstraint(
    'users',
    'users_birth_year_check',
    `CHECK (birth_year >= 1900)`,
  );
};

export const down = false;
