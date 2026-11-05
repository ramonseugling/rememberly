import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { UnauthorizedError, ValidationError } from 'infra/errors';
import {
  bearerToken,
  mobileError,
  mobileGet,
  recordMobileFailure,
} from 'infra/mobile-controller';
import accountDeletion, { OwnedGroupsError } from 'models/account-deletion';
import { PasswordConfirmationError } from 'models/session-security';

export const config = { api: { bodyParser: false } };

const getHandler = mobileGet('/api/v1/mobile/me', async (identity) => ({
  user: {
    id: identity.user_id,
    name: identity.name,
    email: identity.email,
    birth_day: identity.birth_day,
    birth_month: identity.birth_month,
    birth_year: identity.birth_year,
  },
}));

const schema = z
  .object({ password: z.string().min(1), confirmation: z.literal('DELETE') })
  .strict();

async function readConfirmation(req: NextApiRequest) {
  if (
    req.headers['content-type']?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    return null;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 16384) return null;
    chunks.push(buffer);
  }
  try {
    const parsed = schema.safeParse(
      JSON.parse(Buffer.concat(chunks).toString('utf8')),
    );
    return parsed.success ? parsed.data.password : null;
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') return getHandler(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({
      name: 'MethodNotAllowedError',
      message: 'Method not allowed.',
      action: 'Use GET or DELETE.',
      status_code: 405,
    });
  }
  try {
    const token = bearerToken(req);
    if (!token) return mobileError(res, 'session');
    const confirmation = await readConfirmation(req);
    if (confirmation === null || Object.keys(req.query).length)
      throw new ValidationError({
        message: 'Invalid account deletion request.',
        action:
          'Send your current password and confirmation DELETE as JSON without query parameters.',
      });
    await accountDeletion.deleteAccount(token, confirmation);
    return res.status(204).end();
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof UnauthorizedError ||
      error instanceof PasswordConfirmationError ||
      error instanceof OwnedGroupsError
    ) {
      if (error instanceof UnauthorizedError)
        res.setHeader('WWW-Authenticate', 'Bearer realm="rememberly"');
      return res.status(error.status_code).json(error.toJSON());
    }
    recordMobileFailure(req, '/api/v1/mobile/me');
    return mobileError(res, 'internal');
  }
}
