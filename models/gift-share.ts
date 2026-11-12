import crypto from 'node:crypto';
import database from 'infra/database';

// Public link code of a gift list: random, not derived from the account, and
// replaceable so a leaked link can be revoked.
export const SHARE_TOKEN = /^[A-Za-z0-9_-]{22}$/;

function newToken() {
  return crypto.randomBytes(16).toString('base64url');
}

async function getOrCreateToken(userId: string): Promise<string> {
  const list = await database.query(
    `INSERT INTO gift_lists (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = excluded.user_id
     RETURNING id, share_token`,
    [userId],
  );
  const row = list.rows[0] as { id: string; share_token: string | null };
  if (row.share_token) return row.share_token;
  const updated = await database.query(
    `UPDATE gift_lists SET share_token = $2
     WHERE id = $1 AND share_token IS NULL
     RETURNING share_token`,
    [row.id, newToken()],
  );
  if (updated.rows[0]) return updated.rows[0].share_token as string;
  const current = await database.query(
    'SELECT share_token FROM gift_lists WHERE id = $1',
    [row.id],
  );
  return current.rows[0].share_token as string;
}

async function rotateToken(userId: string): Promise<string> {
  await getOrCreateToken(userId);
  const result = await database.query(
    `UPDATE gift_lists SET share_token = $2, updated_at = now()
     WHERE user_id = $1
     RETURNING share_token`,
    [userId, newToken()],
  );
  return result.rows[0].share_token as string;
}

async function findOwnerIdByToken(token: string): Promise<string | null> {
  if (!SHARE_TOKEN.test(token)) return null;
  const result = await database.query(
    'SELECT user_id FROM gift_lists WHERE share_token = $1',
    [token],
  );
  return (result.rows[0]?.user_id as string | undefined) ?? null;
}

const giftShare = { getOrCreateToken, rotateToken, findOwnerIdByToken };

export default giftShare;
