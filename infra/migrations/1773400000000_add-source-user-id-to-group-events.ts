import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.addColumn('group_events', {
    source_user_id: {
      type: 'uuid',
      notNull: false,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.createIndex('group_events', 'source_user_id');
};

export const down = false;
