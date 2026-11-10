import database from 'infra/database';
import { UnauthorizedError } from 'infra/errors';
import otp from 'models/otp';
import password from 'models/password';
import photo from 'models/photo';
import { PasswordConfirmationError } from 'models/session-security';

export class OwnedGroupsError extends Error {
  readonly status_code = 409;
  readonly action = 'Delete the groups you own before deleting your account.';
  constructor() {
    super('Account deletion is blocked while you own groups.');
    this.name = 'ConflictError';
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.status_code,
    };
  }
}

export type DeletionCredential =
  | string
  | { password: string }
  | { otpCode: string };

async function deleteAccount(token: string, credential: DeletionCredential) {
  let avatarUrl: string | null = null;
  let giftPhotoUrls: string[] = [];
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    const identified = await client.query(
      'SELECT user_id FROM sessions WHERE token = $1',
      [token],
    );
    // Use the same user-before-session lock order as session security. The user
    // lock also prevents a concurrent group FK insertion from bypassing the guard.
    const found = await client.query(
      'SELECT id, email, password FROM users WHERE id = $1 FOR UPDATE',
      [identified.rows[0]?.user_id ?? null],
    );
    const user = found.rows[0];
    const current = await client.query(
      `SELECT id FROM sessions WHERE token = $1 AND user_id = $2
       AND (expires_at IS NULL OR expires_at > NOW()) FOR UPDATE`,
      [token, user?.id ?? null],
    );
    if (!user || !current.rows[0])
      throw new UnauthorizedError({
        message: 'A valid Bearer session is required.',
        action:
          'Sign in and send your session token in the Authorization header.',
      });
    if (typeof credential === 'object' && 'otpCode' in credential) {
      await otp.verify(user.email, credential.otpCode);
    } else {
      const secret =
        typeof credential === 'string' ? credential : credential.password;
      if (!user.password || !(await password.compare(secret, user.password)))
        throw new PasswordConfirmationError();
    }
    const owned = await client.query(
      'SELECT id FROM groups WHERE created_by = $1 LIMIT 1',
      [user.id],
    );
    if (owned.rows.length) throw new OwnedGroupsError();
    await client.query(
      'DELETE FROM otp_tokens WHERE LOWER(email) = LOWER($1)',
      [user.email],
    );
    // error_logs has no FK, so remove attributed records explicitly.
    await client.query('DELETE FROM error_logs WHERE user_id = $1', [user.id]);
    const avatar = await client.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [user.id],
    );
    avatarUrl = avatar.rows[0]?.avatar_url ?? null;
    const giftPhotos = await client.query(
      `SELECT i.photo_url FROM gift_items i
       JOIN gift_lists l ON l.id = i.list_id
       WHERE l.user_id = $1 AND i.photo_url IS NOT NULL`,
      [user.id],
    );
    giftPhotoUrls = giftPhotos.rows.map((row) => row.photo_url as string);
    await client.query('DELETE FROM users WHERE id = $1', [user.id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
  await photo.removeQuietly(avatarUrl);
  for (const url of giftPhotoUrls) await photo.removeQuietly(url);
}

export default { deleteAccount };
