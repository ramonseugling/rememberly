import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    CREATE TABLE push_preferences (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      push_enabled boolean NOT NULL DEFAULT false
    );
    CREATE TABLE push_devices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      installation_id uuid NOT NULL UNIQUE,
      expo_push_token text NOT NULL UNIQUE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      platform text NOT NULL CHECK (platform IN ('ios', 'android')),
      disabled_at timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE push_deliveries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id uuid NOT NULL REFERENCES push_devices(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      dedup_key text NOT NULL,
      data jsonb NOT NULL,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','ticket','delivered','failed','cancelled')),
      attempts integer NOT NULL DEFAULT 0,
      available_at timestamptz NOT NULL DEFAULT now(),
      lease_until timestamptz,
      lease_id uuid,
      ticket_id text,
      receipt_checks integer NOT NULL DEFAULT 0,
      last_error text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(device_id, dedup_key)
    );
    CREATE INDEX push_deliveries_work ON push_deliveries(status, available_at);
    CREATE TABLE push_attempts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      delivery_id uuid NOT NULL REFERENCES push_deliveries(id) ON DELETE CASCADE,
      attempt integer NOT NULL,
      started_at timestamptz NOT NULL DEFAULT now(),
      finished_at timestamptz,
      outcome text,
      UNIQUE(delivery_id, attempt)
    );
  `);
};
export const down = false;
