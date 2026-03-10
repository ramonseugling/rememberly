import { log } from 'next-axiom';
import crypto from 'crypto';
import database from 'infra/database';
import { ValidationError } from 'infra/errors';
import password from 'models/password';
import user from 'models/user';

const EXPIRATION_IN_MS = 1000 * 60 * 60; // 1 hora

async function createToken(email: string) {
  const foundUser = await user.findOneByEmail(email);

  if (!foundUser) {
    return null;
  }

  await invalidatePreviousTokens(foundUser.id);

  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MS);

  await database.query(
    `INSERT INTO password_reset_tokens (token, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [token, foundUser.id, expiresAt],
  );

  log.info('password_reset_token_created', { userId: foundUser.id });

  return { token, user: foundUser };
}

async function resetPassword(token: string, newPassword: string) {
  const result = await database.query(
    `SELECT prt.id, prt.user_id
     FROM password_reset_tokens prt
     WHERE prt.token = $1 
       AND prt.expires_at > NOW()
       AND prt.used_at IS NULL
     LIMIT 1`,
    [token],
  );

  const tokenRow = result.rows[0];

  if (!tokenRow) {
    throw new ValidationError({
      message: 'Link inválido ou expirado.',
      action: 'Solicite um novo link de redefinição de senha.',
    });
  }

  const hashedPassword = await password.hash(newPassword);

  await database.query(`UPDATE users SET password = $1 WHERE id = $2`, [
    hashedPassword,
    tokenRow.user_id,
  ]);

  await database.query(
    `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
    [tokenRow.id],
  );

  log.info('password_reset_completed', { userId: tokenRow.user_id });
}

async function invalidatePreviousTokens(userId: string) {
  await database.query(
    `UPDATE password_reset_tokens
     SET expires_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [userId],
  );
}

const passwordReset = { createToken, resetPassword };

export default passwordReset;
