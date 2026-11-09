import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    CREATE TABLE gift_lists (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE gift_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      list_id uuid NOT NULL REFERENCES gift_lists(id) ON DELETE CASCADE,
      title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
      link text CHECK (link IS NULL OR char_length(link) <= 2000),
      description text CHECK (description IS NULL OR char_length(description) <= 500),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX gift_items_list_created_idx
      ON gift_items (list_id, created_at DESC, id);
  `);
};

export const down = false;
