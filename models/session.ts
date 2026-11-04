import crypto from 'crypto';
import database from 'infra/database';
import { UnauthorizedError } from 'infra/errors';
import authentication from 'models/authentication';

const EXPIRATION_IN_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

async function create(email: string, rawPassword: string) {
  return createPasswordSession(email, rawPassword, false);
}

async function createPasswordSession(
  email: string,
  rawPassword: string,
  persistent: boolean,
) {
  const user = await authentication.getAuthenticatedUser(email, rawPassword);
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    // Lock user before inserting a session, matching reset/revocation lock order.
    const current = await client.query(
      'SELECT password FROM users WHERE id = $1 FOR SHARE',
      [user.id],
    );
    if (!current.rows[0] || current.rows[0].password !== user.password) {
      throw new UnauthorizedError({
        message: 'Dados de autenticação não conferem.',
        action: 'Verifique se os dados enviados estão corretos.',
      });
    }
    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = persistent
      ? null
      : new Date(Date.now() + EXPIRATION_IN_MS);
    const result = await client.query(
      `INSERT INTO sessions (token, user_id, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, token, user_id, expires_at, created_at`,
      [token, user.id, expiresAt],
    );
    await client.query('COMMIT');
    return { ...result.rows[0], name: user.name, email: user.email };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function findOneValidByToken(token: string) {
  const sessionFound = await runSelectQuery(token);

  return sessionFound;

  async function runSelectQuery(token: string) {
    const result = await database.query(
      `SELECT s.*, u.id as user_id, u.name, u.email, u.birth_day, u.birth_month, u.birth_year, u.is_admin
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND (s.expires_at IS NULL OR s.expires_at > NOW())
       LIMIT 1`,
      [token],
    );

    return result.rows[0] ?? null;
  }
}

async function expireByToken(token: string) {
  await runUpdateQuery(token);

  async function runUpdateQuery(token: string) {
    await database.query(
      `UPDATE sessions SET expires_at = NOW() WHERE token = $1`,
      [token],
    );
  }
}

async function createForUser(user: {
  id: string;
  name: string;
  email: string;
}) {
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM users WHERE id = $1 FOR SHARE', [
      user.id,
    ]);
    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + EXPIRATION_IN_MS);
    const result = await client.query(
      `INSERT INTO sessions (token, user_id, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, token, user_id, expires_at, created_at`,
      [token, user.id, expiresAt],
    );
    await client.query('COMMIT');
    return { ...result.rows[0], name: user.name, email: user.email };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function createPersistent(email: string, rawPassword: string) {
  return createPasswordSession(email, rawPassword, true);
}

const session = {
  create,
  createForUser,
  createPersistent,
  findOneValidByToken,
  expireByToken,
};

export default session;
