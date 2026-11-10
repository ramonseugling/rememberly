import database from 'infra/database';

export const preferenceDefaults = {
  time_zone: 'America/Sao_Paulo',
  daily_time: '09:00',
} as const;

export interface NotificationPreferencesUpdate {
  push_enabled?: boolean;
  email_events?: boolean;
  email_marketing?: boolean;
  push_marketing?: boolean;
}

interface Queryable {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[] }>;
}

export async function createDefaults(
  client: Queryable,
  userId: string,
  emailMarketing: boolean,
) {
  await client.query(
    `INSERT INTO notification_preferences (user_id, push_events, email_events, email_marketing)
     VALUES ($1, false, true, $2) ON CONFLICT (user_id) DO NOTHING`,
    [userId, emailMarketing],
  );
}

export async function setEmailMarketing(userId: string, enabled: boolean) {
  await database.query(
    `INSERT INTO notification_preferences (user_id, push_events, email_events, email_marketing)
     VALUES ($1, false, true, $2)
     ON CONFLICT (user_id) DO UPDATE SET email_marketing = excluded.email_marketing, updated_at = now()`,
    [userId, enabled],
  );
}

export async function preferences(
  userId: string,
  update: NotificationPreferencesUpdate = {},
) {
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    const hasUpdate = Object.values(update).some(
      (value) => value !== undefined,
    );
    if (hasUpdate) {
      await client.query(
        `INSERT INTO notification_preferences (user_id, push_events, email_events, email_marketing, push_marketing)
         VALUES ($1, COALESCE($2, false), COALESCE($3, true),
                 COALESCE($4, (SELECT marketing_consent FROM users WHERE id = $1), true),
                 COALESCE($5, false))
         ON CONFLICT (user_id) DO UPDATE SET
           push_events = COALESCE($2, notification_preferences.push_events),
           email_events = COALESCE($3, notification_preferences.email_events),
           email_marketing = COALESCE($4, notification_preferences.email_marketing),
           push_marketing = COALESCE($5, notification_preferences.push_marketing),
           updated_at = now()`,
        [
          userId,
          update.push_enabled ?? null,
          update.email_events ?? null,
          update.email_marketing ?? null,
          update.push_marketing ?? null,
        ],
      );
    }
    if (update.push_enabled === false)
      await client.query(
        `UPDATE push_deliveries SET status='cancelled',updated_at=now()
         WHERE user_id=$1 AND status IN ('pending','sending')
         AND COALESCE(data->>'kind', '') NOT IN ('announcement', 'announcement_test')`,
        [userId],
      );
    if (update.push_marketing === false)
      await client.query(
        `UPDATE push_deliveries SET status='cancelled',updated_at=now()
         WHERE user_id=$1 AND status IN ('pending','sending')
         AND data->>'kind' = 'announcement'`,
        [userId],
      );
    const result = await client.query(
      `SELECT np.push_events, np.email_events, np.email_marketing, np.push_marketing, u.marketing_consent
       FROM users u LEFT JOIN notification_preferences np ON np.user_id = u.id
       WHERE u.id = $1`,
      [userId],
    );
    await client.query('COMMIT');
    const row = result.rows[0];
    return {
      push_enabled: row?.push_events ?? false,
      email_events: row?.email_events ?? true,
      email_marketing: row?.email_marketing ?? row?.marketing_consent ?? true,
      push_marketing: row?.push_marketing ?? false,
      ...preferenceDefaults,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
