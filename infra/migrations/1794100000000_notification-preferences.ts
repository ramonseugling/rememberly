import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    ALTER TABLE push_preferences RENAME TO notification_preferences;
    ALTER TABLE notification_preferences RENAME COLUMN push_enabled TO push_events;
    ALTER TABLE notification_preferences
      ADD COLUMN email_events boolean NOT NULL DEFAULT true,
      ADD COLUMN email_marketing boolean NOT NULL DEFAULT true,
      ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    UPDATE notification_preferences np
      SET email_marketing = u.marketing_consent
      FROM users u WHERE u.id = np.user_id;
    INSERT INTO notification_preferences (user_id, push_events, email_events, email_marketing)
      SELECT u.id, false, true, u.marketing_consent FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM notification_preferences np WHERE np.user_id = u.id
      );
  `);
};

export const down = false;
