import crypto from 'node:crypto';
import database from 'infra/database';
import { ValidationError } from 'infra/errors';

const EXPIRATION_IN_MS = 1000 * 60 * 10; // 10 minutes
const MAX_ATTEMPTS = 5;
export const CODE_RATE_LIMIT_MAX = 5; // codes per e-mail per hour

export type OtpPurpose = 'signup' | 'password_reset';

async function create(email: string, purpose: OtpPurpose = 'signup') {
  await invalidatePrevious(email, purpose);

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MS);

  const result = await database.query(
    `INSERT INTO otp_tokens (email, code, expires_at, purpose)
     VALUES (LOWER($1), $2, $3, $4)
     RETURNING *`,
    [email, code, expiresAt, purpose],
  );

  return result.rows[0];
}

async function verify(
  email: string,
  code: string,
  purpose: OtpPurpose = 'signup',
) {
  const result = await database.query(
    `SELECT * FROM otp_tokens
     WHERE LOWER(email) = LOWER($1)
       AND used_at IS NULL
       AND expires_at > NOW()
       AND attempts < $2
       AND purpose = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, MAX_ATTEMPTS, purpose],
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

async function invalidatePrevious(email: string, purpose: OtpPurpose) {
  await database.query(
    `UPDATE otp_tokens SET used_at = NOW()
     WHERE LOWER(email) = LOWER($1) AND used_at IS NULL AND purpose = $2`,
    [email, purpose],
  );
}

async function countRecent(email: string, purpose: OtpPurpose, hours = 1) {
  const result = await database.query(
    `SELECT COUNT(*)::int AS count FROM otp_tokens
     WHERE LOWER(email) = LOWER($1)
       AND purpose = $2
       AND created_at > NOW() - ($3 || ' hours')::interval`,
    [email, purpose, String(hours)],
  );
  return result.rows[0].count as number;
}

async function isRateLimited(email: string, purpose: OtpPurpose) {
  return (await countRecent(email, purpose)) >= CODE_RATE_LIMIT_MAX;
}

const otp = { create, verify, markAsUsed, countRecent, isRateLimited };

export default otp;
