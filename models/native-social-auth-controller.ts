import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { recordMobileFailure } from 'infra/mobile-controller';
import {
  consumeLoginEmail,
  consumeLoginIp,
  respondToLoginLimit,
} from 'models/login-rate-limit';
import {
  createNativeSocialChallenge,
  exchangeNativeSocialIdentity,
} from 'models/native-social-auth';
import { NativeSocialAuthError } from 'models/native-social-auth-verifier';

const provider = z.enum(['google', 'apple']);
const challengeSchema = z
  .object({ provider, purpose: z.literal('login') })
  .strict();
const exchangeSchema = z
  .object({
    provider,
    challenge_id: z.string().uuid(),
    identity_token: z.string().min(1).max(16384),
  })
  .strict();

async function readJson(req: NextApiRequest) {
  if (
    req.headers['content-type']?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    return null;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 20 * 1024) return null;
    chunks.push(bytes);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

export function nativeSocialHandler(operation: 'challenges' | 'exchange') {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    const fail = (
      status: number,
      name: string,
      message: string,
      action: string,
    ) =>
      res.status(status).json({ name, message, action, status_code: status });
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return fail(
        405,
        'MethodNotAllowedError',
        'Method not allowed.',
        'Use POST.',
      );
    }
    try {
      await consumeLoginIp(req);
      if (Object.keys(req.query).length)
        return fail(
          400,
          'ValidationError',
          'Query parameters are not supported.',
          'Remove query parameters.',
        );
      const body = await readJson(req);
      if (operation === 'challenges') {
        const parsed = challengeSchema.safeParse(body);
        if (!parsed.success)
          return fail(
            400,
            'ValidationError',
            'Invalid social login request.',
            'Provide provider and login purpose.',
          );
        return res
          .status(201)
          .json(await createNativeSocialChallenge(parsed.data.provider));
      }
      const parsed = exchangeSchema.safeParse(body);
      if (!parsed.success)
        return fail(
          400,
          'ValidationError',
          'Invalid social login request.',
          'Provide provider, challenge_id and identity_token.',
        );
      const created = await exchangeNativeSocialIdentity(
        parsed.data.provider,
        parsed.data.challenge_id,
        parsed.data.identity_token,
        { consumeEmail: consumeLoginEmail },
      );
      return res.status(201).json({
        token: created.token,
        token_type: 'Bearer',
        expires_at: created.expires_at,
        user: {
          id: created.user_id,
          name: created.name,
          email: created.email,
        },
      });
    } catch (error) {
      if (respondToLoginLimit(res, error)) return;
      if (error instanceof NativeSocialAuthError) {
        if (error.code === 'unavailable')
          return fail(
            503,
            'ServiceError',
            'Social login is temporarily unavailable.',
            'Try another sign-in method or try again later.',
          );
        if (error.code === 'collision')
          return fail(
            409,
            'AccountLinkRequiredError',
            'This account requires verified linking.',
            'Sign in with your existing method. Native account linking is not available yet.',
          );
        return fail(
          401,
          'UnauthorizedError',
          'Invalid social login proof.',
          'Start a new sign-in attempt.',
        );
      }
      recordMobileFailure(req, `/api/v1/mobile/auth/${operation}`);
      return fail(
        500,
        'InternalServerError',
        'An unexpected error occurred.',
        'Try again later.',
      );
    }
  };
}
