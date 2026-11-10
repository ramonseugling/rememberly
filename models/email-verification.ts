import crypto from 'node:crypto';
import database from 'infra/database';
import { ValidationError } from 'infra/errors';

const EXPIRATION_IN_MS = 1000 * 60 * 30;

function hash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function create(email: string) {
  const token = crypto.randomBytes(32).toString('hex');
  await database.query(
    `INSERT INTO email_verifications (email, token_hash, expires_at)
     VALUES (LOWER($1), $2, $3)`,
    [email, hash(token), new Date(Date.now() + EXPIRATION_IN_MS)],
  );
  return token;
}

async function verify(email: string, token: string) {
  const result = await database.query(
    `SELECT id FROM email_verifications
     WHERE token_hash = $1
       AND LOWER(email) = LOWER($2)
       AND used_at IS NULL
       AND expires_at > NOW()`,
    [hash(token), email],
  );
  const record = result.rows[0] as { id: string } | undefined;
  if (!record) {
    throw new ValidationError({
      message: 'A verificação do e-mail é inválida ou expirou.',
      action: 'Confirme o e-mail novamente com um novo código.',
    });
  }
  return record;
}

async function markAsUsed(id: string) {
  await database.query(
    'UPDATE email_verifications SET used_at = NOW() WHERE id = $1',
    [id],
  );
}

const emailVerification = { create, verify, markAsUsed };

export default emailVerification;
