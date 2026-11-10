import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    CREATE TABLE communications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      push_title TEXT,
      push_body TEXT,
      email_subject TEXT,
      email_body TEXT,
      send_email BOOLEAN NOT NULL DEFAULT true,
      send_push BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sending', 'sent')),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      sent_at TIMESTAMPTZ,
      email_sent INTEGER NOT NULL DEFAULT 0,
      email_failed INTEGER NOT NULL DEFAULT 0,
      push_users INTEGER NOT NULL DEFAULT 0,
      push_devices INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE communication_deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      channel TEXT NOT NULL CHECK (channel IN ('email', 'push')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT communication_deliveries_unique UNIQUE (communication_id, user_id, channel)
    );
  `);
};

export const down = false;
