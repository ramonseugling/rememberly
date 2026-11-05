import database from 'infra/database';

export class PushSessionError extends Error {}
export const preferenceDefaults = {
  time_zone: 'America/Sao_Paulo',
  daily_time: '09:00',
} as const;
export async function preferences(userId: string, enabled?: boolean) {
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    if (enabled !== undefined)
      await client.query(
        `INSERT INTO push_preferences(user_id,push_enabled) VALUES($1,$2)
        ON CONFLICT(user_id) DO UPDATE SET push_enabled=excluded.push_enabled`,
        [userId, enabled],
      );
    if (enabled === false)
      await client.query(
        `UPDATE push_deliveries SET status='cancelled',updated_at=now()
        WHERE user_id=$1 AND status IN ('pending','sending')`,
        [userId],
      );
    const result = await client.query(
      'SELECT push_enabled FROM push_preferences WHERE user_id=$1',
      [userId],
    );
    await client.query('COMMIT');
    return {
      push_enabled: result.rows[0]?.push_enabled ?? false,
      ...preferenceDefaults,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
export async function registerDevice(
  userId: string,
  sessionId: string,
  input: {
    installation_id: string;
    expo_push_token: string;
    platform: 'ios' | 'android';
  },
) {
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    // Match account revocation's user-before-session lock order.
    const user = await client.query(
      'SELECT id FROM users WHERE id=$1 FOR SHARE',
      [userId],
    );
    const current = await client.query(
      `SELECT id FROM sessions WHERE id=$1 AND user_id=$2
      AND (expires_at IS NULL OR expires_at>now()) FOR SHARE`,
      [sessionId, userId],
    );
    if (!user.rowCount || !current.rowCount) throw new PushSessionError();
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('rememberly-push-registration'))",
    );
    // Rebind across accounts/tokens without exposing the previous owner's existence.
    await client.query(
      `DELETE FROM push_devices WHERE
      (expo_push_token=$2 AND installation_id<>$1) OR (installation_id=$1 AND user_id<>$3)`,
      [input.installation_id, input.expo_push_token, userId],
    );
    await client.query(
      `UPDATE push_deliveries SET status='cancelled',updated_at=now()
      WHERE device_id IN (SELECT id FROM push_devices WHERE installation_id=$1 AND session_id<>$2)
      AND status IN ('pending','sending')`,
      [input.installation_id, sessionId],
    );
    await client.query(
      `INSERT INTO push_devices(installation_id,expo_push_token,user_id,session_id,platform)
      VALUES($1,$2,$3,$4,$5) ON CONFLICT(installation_id) DO UPDATE SET
      expo_push_token=excluded.expo_push_token,session_id=excluded.session_id,platform=excluded.platform,
      disabled_at=NULL,updated_at=now()`,
      [
        input.installation_id,
        input.expo_push_token,
        userId,
        sessionId,
        input.platform,
      ],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
export async function removeDevice(userId: string, installationId: string) {
  await database.query(
    'DELETE FROM push_devices WHERE user_id=$1 AND installation_id=$2',
    [userId, installationId],
  );
}
