import crypto from 'node:crypto';
import database from 'infra/database';
import { ValidationError } from 'infra/errors';

const EXPIRATION_IN_MS = 1000 * 60 * 10; // 10 minutes
const MAX_ATTEMPTS = 5;

async function create(email: string) {
  await invalidatePrevious(email);

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MS);

  const result = await database.query(
    `INSERT INTO otp_tokens (email, code, expires_at)
     VALUES (LOWER($1), $2, $3)
     RETURNING *`,
    [email, code, expiresAt],
  );

  return result.rows[0];
}

async function verify(email: string, code: string) {
  const result = await database.query(
    `SELECT * FROM otp_tokens
     WHERE LOWER(email) = LOWER($1)
       AND used_at IS NULL
       AND expires_at > NOW()
       AND attempts < $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, MAX_ATTEMPTS],
  );

  const otpRecord = result.rows[0];

  if (!otpRecord) {
    throw new ValidationError({
      message:
        'Código de verificação inválido, expirado ou tentativas esgotadas.',
      action: 'Solicite um novo código e tente novamente.',
    });
  }

  if (otpRecord.code !== code) {
    await database.query(
      `UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = $1`,
      [otpRecord.id],
    );

    throw new ValidationError({
      message: 'Código de verificação incorreto.',
      action: 'Verifique o código enviado para o seu e-mail e tente novamente.',
    });
  }

  return otpRecord;
}

async function markAsUsed(id: string) {
  await database.query(`UPDATE otp_tokens SET used_at = NOW() WHERE id = $1`, [
    id,
  ]);
}

async function invalidatePrevious(email: string) {
  await database.query(
    `UPDATE otp_tokens SET used_at = NOW()
     WHERE LOWER(email) = LOWER($1) AND used_at IS NULL`,
    [email],
  );
}

const otp = { create, verify, markAsUsed };

export default otp;
