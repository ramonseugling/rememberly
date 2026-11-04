import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import { isIP } from 'net';
import database from 'infra/database';
import { ServiceError, TooManyRequestsError } from 'infra/errors';

export const LOGIN_WINDOW_SECONDS = 15 * 60;
export const LOGIN_EMAIL_LIMIT = 10;
export const LOGIN_IP_LIMIT = 100;
export const LOGIN_CLEANUP_BATCH = 100;

type Scope = 'email' | 'ip';

export class LoginLimitError extends TooManyRequestsError {
  constructor(readonly retryAfterSeconds: number) {
    super({
      message: 'Too many login attempts.',
      action: 'Wait before trying again.',
    });
  }
}

export class LoginLimitUnavailableError extends ServiceError {
  constructor() {
    super({
      message: 'Login is temporarily unavailable.',
      action: 'Try again later.',
    });
  }
}

function canonicalIp(value: string | undefined) {
  if (!value) return null;
  const address = value.trim().toLowerCase();
  if (address.startsWith('::ffff:') && isIP(address.slice(7)) === 4) {
    return address.slice(7);
  }
  const version = isIP(address);
  if (version === 4) return address;
  if (version === 6 && !address.includes('%')) {
    const normalized = new URL(`http://[${address}]/`).hostname.slice(1, -1);
    const mapped = /^::ffff:([a-f0-9]+):([a-f0-9]+)$/.exec(normalized);
    if (mapped) {
      const high = parseInt(mapped[1], 16);
      const low = parseInt(mapped[2], 16);
      return [high >> 8, high & 255, low >> 8, low & 255].join('.');
    }
    return normalized;
  }
  return null;
}

export function loginSourceIp(
  req: Pick<NextApiRequest, 'headers' | 'socket'>,
  environment: Partial<NodeJS.ProcessEnv> = process.env,
) {
  // This reserved header is trusted only in an established Vercel runtime.
  const vercelRuntime =
    environment.VERCEL === '1' &&
    ['production', 'preview', 'development'].includes(
      environment.VERCEL_ENV ?? '',
    ) &&
    Boolean(environment.VERCEL_REGION);
  const injected = req.headers['x-vercel-forwarded-for'];
  if (vercelRuntime && typeof injected === 'string') {
    const address = canonicalIp(injected);
    if (address) return address;
  }
  return canonicalIp(req.socket.remoteAddress) ?? 'unknown-source';
}

async function consume(scope: Scope, identity: string) {
  const limit = scope === 'email' ? LOGIN_EMAIL_LIMIT : LOGIN_IP_LIMIT;
  const normalized =
    scope === 'email' ? identity.trim().toLowerCase() : identity;
  const fingerprint = createHash('sha256')
    .update(`${scope}\0${normalized}`)
    .digest('hex');

  let result;
  try {
    result = await database.query(
      `WITH current_window AS (
         SELECT to_timestamp(
           floor(extract(epoch FROM statement_timestamp()) / $3::integer) * $3::integer
         ) AS starts_at
       ), cleanup AS (
         DELETE FROM login_rate_limits
         WHERE bucket_id IN (
           SELECT bucket_id FROM login_rate_limits
           WHERE expires_at <= statement_timestamp()
           ORDER BY expires_at LIMIT $4 FOR UPDATE SKIP LOCKED
         )
       ), attempt AS (
         INSERT INTO login_rate_limits (bucket_id, scope, attempts, expires_at)
         SELECT encode(sha256(convert_to($1 || ':' || extract(epoch FROM starts_at)::text, 'UTF8')), 'hex'),
                $2, 1, starts_at + ($3::integer * interval '1 second')
         FROM current_window
         ON CONFLICT (bucket_id) DO UPDATE
         SET attempts = LEAST(login_rate_limits.attempts + 1, $5 + 1)
         RETURNING attempts, expires_at
       )
       SELECT attempts,
              GREATEST(1, ceil(extract(epoch FROM (expires_at - statement_timestamp()))))::int
                AS retry_after_seconds
       FROM attempt`,
      [fingerprint, scope, LOGIN_WINDOW_SECONDS, LOGIN_CLEANUP_BATCH, limit],
    );
    if (!result.rows[0]) throw new Error('Missing login rate-limit result');
  } catch {
    // Never expose connection details, hashed identities, or SQL in responses/logs.
    throw new LoginLimitUnavailableError();
  }

  if (result.rows[0].attempts > limit) {
    throw new LoginLimitError(result.rows[0].retry_after_seconds);
  }
}

export function consumeLoginIp(req: NextApiRequest) {
  return consume('ip', loginSourceIp(req));
}

export function consumeLoginEmail(email: string) {
  return consume('email', email);
}

export function respondToLoginLimit(res: NextApiResponse, error: unknown) {
  if (error instanceof LoginLimitError) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', String(error.retryAfterSeconds));
    res.status(429).json({
      ...error.toJSON(),
      retry_after_seconds: error.retryAfterSeconds,
    });
    return true;
  }
  if (error instanceof LoginLimitUnavailableError) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json(error.toJSON());
    return true;
  }
  return false;
}
