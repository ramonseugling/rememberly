import crypto from 'crypto';
import database from 'infra/database';
import { UnauthorizedError } from 'infra/errors';
import user from 'models/user';
import password from 'models/password';

const EXPIRATION_IN_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

async function create(email: string, rawPassword: string) {
  const foundUser = await user.findOneByEmail(email);

  if (!foundUser) {
    throw new UnauthorizedError({
      message: 'Dados de autenticação não conferem.',
      action: 'Verifique seu e-mail e senha.',
    });
  }

  const passwordMatch = await password.compare(rawPassword, foundUser.password);

  if (!passwordMatch) {
    throw new UnauthorizedError({
      message: 'Dados de autenticação não conferem.',
      action: 'Verifique seu e-mail e senha.',
    });
  }

  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MS);

  const result = await database.query(
    `INSERT INTO sessions (token, user_id, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, token, user_id, expires_at, created_at`,
    [token, foundUser.id, expiresAt],
  );

  return result.rows[0];
}

async function findOneValidByToken(token: string) {
  const result = await database.query(
    `SELECT s.*, u.id as user_id, u.name, u.email
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [token],
  );

  return result.rows[0] ?? null;
}

async function expireByToken(token: string) {
  await database.query(
    `UPDATE sessions SET expires_at = NOW() WHERE token = $1`,
    [token],
  );
}

const session = { create, findOneValidByToken, expireByToken };

export default session;
