import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    CREATE TABLE gift_list_groups (
      list_id uuid NOT NULL REFERENCES gift_lists(id) ON DELETE CASCADE,
      group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (list_id, group_id)
    );
    CREATE INDEX gift_list_groups_group_idx ON gift_list_groups (group_id);
  `);
};

export const down = false;
