import database from 'infra/database';
import { UnauthorizedError } from 'infra/errors';
import password from 'models/password';

export class PasswordConfirmationError extends Error {
  readonly action = 'Confirm your current password and try again.';
  readonly status_code = 403;
  constructor() {
    super('Unable to confirm your current password.');
    this.name = 'ForbiddenError';
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

async function revokeOtherSessions(token: string, confirmation: string) {
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    const identified = await client.query(
      'SELECT user_id FROM sessions WHERE token = $1',
      [token],
    );
    const found = await client.query(
      'SELECT id, password FROM users WHERE id = $1 FOR UPDATE',
      [identified.rows[0]?.user_id ?? null],
    );
    const user = found.rows[0];
    const current = await client.query(
      `SELECT id FROM sessions WHERE token = $1 AND user_id = $2
       AND (expires_at IS NULL OR expires_at > NOW()) FOR UPDATE`,
      [token, user?.id ?? null],
    );
    if (!current.rows[0] || !user) {
      throw new UnauthorizedError({
        message: 'A valid Bearer session is required.',
        action:
          'Sign in and send your session token in the Authorization header.',
      });
    }
    if (
      !user.password ||
      !(await password.compare(confirmation, user.password))
    )
      throw new PasswordConfirmationError();
    await client.query(
      `UPDATE sessions SET expires_at = NOW()
       WHERE user_id = $1 AND token <> $2
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [user.id, token],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

export default { revokeOtherSessions };
