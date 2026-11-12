import { log } from 'next-axiom';
import crypto from 'crypto';
import database from 'infra/database';
import { TooManyRequestsError, ValidationError } from 'infra/errors';
import otp from 'models/otp';
import password from 'models/password';
import user from 'models/user';

const EXPIRATION_IN_MS = 1000 * 60 * 30; // reset token after the code is verified
async function requestCode(email: string) {
  const foundUser = await user.findOneByEmail(email);

  if (!foundUser) {
    return null;
  }

  if (!foundUser.password) {
    return { googleOnly: true as const };
  }

  if (await otp.isRateLimited(foundUser.email, 'password_reset')) {
    throw new TooManyRequestsError({
      message: 'Muitas tentativas de redefinição de senha.',
      action: 'Aguarde uma hora antes de tentar novamente.',
    });
  }

  const record = await otp.create(foundUser.email, 'password_reset');

  log.info('password_reset_code_created', { userId: foundUser.id });

  return { code: record.code as string, user: foundUser };
}

// Confirms the e-mailed code and hands back the single-use token that
// resetPassword() expects.
async function verifyCode(email: string, code: string) {
  const record = await otp.verify(email, code, 'password_reset');
  const foundUser = await user.findOneByEmail(email);

  if (!foundUser || !foundUser.password) {
    throw new ValidationError({
      message:
        'Código de verificação inválido, expirado ou tentativas esgotadas.',
      action: 'Solicite um novo código e tente novamente.',
    });
  }

  await otp.markAsUsed(record.id);
  await invalidatePreviousTokens(foundUser.id);

  const token = crypto.randomBytes(48).toString('hex');
  await database.query(
    `INSERT INTO password_reset_tokens (token, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [token, foundUser.id, new Date(Date.now() + EXPIRATION_IN_MS)],
  );

  log.info('password_reset_code_verified', { userId: foundUser.id });

  return token;
}

async function resetPassword(token: string, newPassword: string) {
  const client = await database.getNewClient();
  let userId: string | undefined;
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT prt.id, prt.user_id
       FROM password_reset_tokens prt
       WHERE prt.token = $1 AND prt.expires_at > NOW() AND prt.used_at IS NULL
       LIMIT 1 FOR UPDATE`,
      [token],
    );
    const tokenRow = result.rows[0];
    if (!tokenRow) {
      throw new ValidationError({
        message: 'Verificação inválida ou expirada.',
        action: 'Peça um novo código de redefinição de senha.',
      });
    }
    const hashedPassword = await password.hash(newPassword);
    await client.query('UPDATE users SET password = $1 WHERE id = $2', [
      hashedPassword,
      tokenRow.user_id,
    ]);
    await client.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [tokenRow.id],
    );
    await client.query(
      'UPDATE sessions SET expires_at = NOW() WHERE user_id = $1',
      [tokenRow.user_id],
    );
    await client.query('COMMIT');
    userId = tokenRow.user_id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
  log.info('password_reset_completed', { userId });
}

async function invalidatePreviousTokens(userId: string) {
  await database.query(
    `UPDATE password_reset_tokens
     SET expires_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [userId],
  );
}

const passwordReset = { requestCode, verifyCode, resetPassword };

export default passwordReset;
