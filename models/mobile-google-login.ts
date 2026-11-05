import crypto from 'crypto';
import database from '@/infra/database';
import {
  ServiceError,
  UnauthorizedError,
  ValidationError,
} from '@/infra/errors';
import session from '@/models/session';

export const mobileGoogleReturnUrl = 'rememberly://auth/google';
const hex = /^[a-f0-9]{64}$/;
const digest = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

function rejected() {
  return new UnauthorizedError({
    message: 'O login com Google expirou ou não é válido.',
    action: 'Tente entrar com Google novamente.',
  });
}

export function mobileGoogleCallbackUrl() {
  try {
    const origin = new URL(process.env.APP_URL ?? '');
    if (
      origin.origin !== process.env.APP_URL ||
      (origin.protocol !== 'https:' &&
        !(
          process.env.NODE_ENV !== 'production' && origin.protocol === 'http:'
        )) ||
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET
    )
      throw new Error('Missing Google configuration');
    return `${origin.origin}/api/v1/mobile/auth/google/callback`;
  } catch {
    throw new ServiceError({
      message: 'O login com Google está indisponível.',
      action: 'Tente novamente mais tarde.',
    });
  }
}

export async function startMobileGoogleLogin(
  appState: string,
  challenge: string,
) {
  if (!hex.test(appState) || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) {
    throw new ValidationError({
      message: 'Pedido de login inválido.',
      action: 'Tente novamente pelo aplicativo.',
    });
  }
  const state = crypto.randomBytes(32).toString('hex');
  await database.query(`DELETE FROM mobile_google_logins WHERE id IN
    (SELECT id FROM mobile_google_logins WHERE expires_at <= NOW() ORDER BY expires_at LIMIT 100)`);
  await database.query(
    `INSERT INTO mobile_google_logins (oauth_state_hash, app_state, code_challenge, expires_at)
    VALUES ($1, $2, $3, NOW() + interval '5 minutes') RETURNING *`,
    [digest(state), appState, challenge],
  );
  return state;
}

export async function pendingMobileGoogleLogin(state: string, cookie: string) {
  if (
    !hex.test(state) ||
    !hex.test(cookie) ||
    !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(cookie))
  )
    throw rejected();
  const result = await database.query(
    `SELECT app_state FROM mobile_google_logins
    WHERE oauth_state_hash = $1 AND expires_at > NOW() AND completed_at IS NULL AND used_at IS NULL`,
    [digest(state)],
  );
  if (!result.rows[0]) throw rejected();
  return result.rows[0].app_state as string;
}

export async function completeMobileGoogleLogin(
  state: string,
  cookie: string,
  userId: string,
) {
  await pendingMobileGoogleLogin(state, cookie);
  const code = crypto.randomBytes(32).toString('hex');
  const result = await database.query(
    `UPDATE mobile_google_logins SET user_id = $2, code_hash = $3,
    completed_at = NOW(), expires_at = NOW() + interval '1 minute', updated_at = NOW()
    WHERE oauth_state_hash = $1 AND expires_at > NOW() AND completed_at IS NULL AND used_at IS NULL RETURNING app_state`,
    [digest(state), userId, digest(code)],
  );
  if (!result.rows[0]) throw rejected();
  return `${mobileGoogleReturnUrl}?${new URLSearchParams({ code, state: result.rows[0].app_state })}`;
}

export async function exchangeMobileGoogleLogin(
  code: string,
  verifier: string,
  state: string,
) {
  if (
    !hex.test(code) ||
    !hex.test(state) ||
    !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)
  )
    throw rejected();
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT * FROM mobile_google_logins
      WHERE code_hash = $1 AND app_state = $2 AND expires_at > NOW() AND used_at IS NULL FOR UPDATE`,
      [digest(code), state],
    );
    const login = result.rows[0];
    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
    if (
      !login ||
      !login.completed_at ||
      !login.user_id ||
      login.code_challenge !== challenge
    )
      throw rejected();
    const user = (
      await client.query('SELECT id, name, email FROM users WHERE id = $1', [
        login.user_id,
      ])
    ).rows[0];
    if (!user) throw rejected();
    const created = await session.createPersistentForVerifiedUser(client, user);
    await client.query(
      'UPDATE mobile_google_logins SET used_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *',
      [login.id],
    );
    await client.query('COMMIT');
    return {
      token: created.token,
      token_type: 'Bearer' as const,
      expires_at: created.expires_at,
      user,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
