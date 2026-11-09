import database from 'infra/database';

export class PushSessionError extends Error {}
export {
  preferenceDefaults,
  preferences,
} from 'models/notification-preferences';
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
