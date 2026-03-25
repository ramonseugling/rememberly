import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.dropTable('group_events', { ifExists: true, cascade: true });
};

exports.down = false;
