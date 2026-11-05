import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { UnauthorizedError, ValidationError } from 'infra/errors';
import {
  bearerToken,
  mobileError,
  recordMobileFailure,
} from 'infra/mobile-controller';
import sessionSecurity, {
  PasswordConfirmationError,
} from 'models/session-security';

export const config = { api: { bodyParser: false } };

const schema = z.object({ password: z.string().min(1) }).strict();

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
    const result = schema.safeParse(
      JSON.parse(Buffer.concat(chunks).toString('utf8')),
    );
    return result.success ? result.data.password : null;
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({
      name: 'MethodNotAllowedError',
      message: 'Method not allowed.',
      action: 'Use DELETE.',
      status_code: 405,
    });
  }
  try {
    const token = bearerToken(req);
    if (!token) return mobileError(res, 'session');
    const confirmation = await readConfirmation(req);
    if (confirmation === null || Object.keys(req.query).length) {
      throw new ValidationError({
        message: 'Invalid password confirmation request.',
        action:
          'Send only your current password as JSON without query parameters.',
      });
    }
    await sessionSecurity.revokeOtherSessions(token, confirmation);
    return res.status(204).end();
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof UnauthorizedError ||
      error instanceof PasswordConfirmationError
    ) {
      if (error instanceof UnauthorizedError)
        res.setHeader('WWW-Authenticate', 'Bearer realm="rememberly"');
      return res.status(error.status_code).json(error.toJSON());
    }
    recordMobileFailure(req, '/api/v1/mobile/sessions/others');
    return mobileError(res, 'internal');
  }
}
