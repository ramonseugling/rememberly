import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    CREATE TABLE gift_reservations (
      item_id uuid PRIMARY KEY REFERENCES gift_items(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status text NOT NULL CHECK (status IN ('reserved', 'purchased')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX gift_reservations_user_idx ON gift_reservations (user_id);
  `);
};

export const down = false;
