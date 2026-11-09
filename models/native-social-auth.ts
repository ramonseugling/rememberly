import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { JWTVerifyGetKey } from 'jose';
import database from 'infra/database';
import {
  NativeSocialAuthError,
  type NativeSocialProvider,
  configuredAudiences,
  verifyNativeIdentityToken,
} from 'models/native-social-auth-verifier';
import { createDefaults } from 'models/notification-preferences';
import session from 'models/session';

export const SOCIAL_CHALLENGE_SECONDS = 5 * 60;
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

export async function createNativeSocialChallenge(
  provider: NativeSocialProvider,
) {
  configuredAudiences(provider);
  const nonce = randomBytes(32).toString('hex');
  const result = await database.query(
    `WITH cleanup AS (
       DELETE FROM native_social_challenges WHERE id IN (
         SELECT id FROM native_social_challenges WHERE expires_at <= NOW()
         ORDER BY expires_at LIMIT 100 FOR UPDATE SKIP LOCKED
       )
     )
     INSERT INTO native_social_challenges (provider, purpose, nonce_hash, expires_at)
     VALUES ($1, 'login', $2, NOW() + $3::integer * interval '1 second')
     RETURNING id, expires_at`,
    [provider, hash(nonce), SOCIAL_CHALLENGE_SECONDS],
  );
  return {
    challenge_id: result.rows[0].id,
    nonce,
    expires_at: result.rows[0].expires_at,
    purpose: 'login',
  };
}

export async function exchangeNativeSocialIdentity(
  provider: NativeSocialProvider,
  challengeId: string,
  identityToken: string,
  dependencies: {
    resolver?: JWTVerifyGetKey;
    consumeEmail?: (email: string) => Promise<void>;
  } = {},
) {
  // Validate proof before opening a transaction or accepting any client identity fields.
  const identity = await verifyNativeIdentityToken(
    provider,
    identityToken,
    dependencies.resolver,
  );
  if (identity.email) await dependencies.consumeEmail?.(identity.email);
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    const challenge = (
      await client.query(
        `SELECT nonce_hash FROM native_social_challenges
       WHERE id = $1 AND provider = $2 AND purpose = 'login'
       AND used_at IS NULL AND expires_at > NOW() FOR UPDATE`,
        [challengeId, provider],
      )
    ).rows[0];
    if (
      !challenge ||
      !timingSafeEqual(
        Buffer.from(challenge.nonce_hash, 'hex'),
        Buffer.from(hash(identity.nonce), 'hex'),
      )
    ) {
      throw new NativeSocialAuthError('invalid');
    }
    // Serialize one provider identity across different challenges without a global lock.
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      [`native-social:${provider}:${identity.subject}`],
    );
    let user = (
      await client.query(
        `SELECT u.id, u.name, u.email FROM native_social_identities i JOIN users u ON u.id = i.user_id
       WHERE i.provider = $1 AND i.subject = $2`,
        [provider, identity.subject],
      )
    ).rows[0];
    if (!user) {
      if (!identity.email) throw new NativeSocialAuthError('invalid');
      // Verified email alone never authorizes linking to an existing account.
      await client.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`native-social-email:${identity.email}`],
      );
      const existing = await client.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
        [identity.email],
      );
      if (existing.rows.length) throw new NativeSocialAuthError('collision');
      user = (
        await client.query(
          `INSERT INTO users (name, email, marketing_consent) VALUES ($1, $2, false) RETURNING id, name, email`,
          [identity.name, identity.email],
        )
      ).rows[0];
      await createDefaults(client, user.id, false);
      await client.query(
        'INSERT INTO native_social_identities (provider, subject, user_id) VALUES ($1, $2, $3)',
        [provider, identity.subject, user.id],
      );
    }
    const created = await session.createPersistentForVerifiedUser(client, user);
    await client.query(
      'UPDATE native_social_challenges SET used_at = NOW() WHERE id = $1',
      [challengeId],
    );
    await client.query('COMMIT');
    return created;
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { code?: string }).code === '23505')
      throw new NativeSocialAuthError('collision');
    throw error;
  } finally {
    await client.end();
  }
}
