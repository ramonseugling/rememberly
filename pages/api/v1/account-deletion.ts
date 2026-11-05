import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { UnauthorizedError } from 'infra/errors';
import accountDeletion, { OwnedGroupsError } from 'models/account-deletion';
import session from 'models/session';
import { PasswordConfirmationError } from 'models/session-security';

export const config = { api: { bodyParser: false } };
const schema = z
  .object({ password: z.string().min(1), confirmation: z.literal('DELETE') })
  .strict();

function trustedOrigin(req: NextApiRequest) {
  try {
    const configured = new URL(process.env.APP_URL ?? '');
    return (
      ['http:', 'https:'].includes(configured.protocol) &&
      req.headers.origin === configured.origin &&
      (!req.headers['sec-fetch-site'] ||
        req.headers['sec-fetch-site'] === 'same-origin')
    );
  } catch {
    return false;
  }
}

async function readBody(req: NextApiRequest) {
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
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function failure(
  res: NextApiResponse,
  status: number,
  name: string,
  message: string,
  action: string,
) {
  return res
    .status(status)
    .json({ name, message, action, status_code: status });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return failure(
      res,
      405,
      'MethodNotAllowedError',
      'Method not allowed.',
      'Use POST.',
    );
  }
  if (!trustedOrigin(req))
    return failure(
      res,
      403,
      'ForbiddenError',
      'Request origin could not be verified.',
      'Open the account deletion page on Rememberly and try again.',
    );
  try {
    const cookieNames = (req.headers.cookie ?? '')
      .split(';')
      .filter((part) => part.trim().split('=')[0] === 'session_token');
    const token = req.cookies.session_token;
    if (
      cookieNames.length !== 1 ||
      !token ||
      !/^[a-f0-9]{96}$/.test(token) ||
      !(await session.findOneValidByToken(token))
    )
      return failure(
        res,
        401,
        'UnauthorizedError',
        'A valid web session is required.',
        'Sign in and try again.',
      );
    const body = await readBody(req);
    if (!body || Object.keys(req.query).length)
      return failure(
        res,
        400,
        'ValidationError',
        'Invalid account deletion request.',
        'Send your current password and confirmation DELETE as JSON without query parameters.',
      );
    await accountDeletion.deleteAccount(token, body.password);
    res.setHeader(
      'Set-Cookie',
      `session_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    );
    return res.status(204).end();
  } catch (error) {
    if (
      error instanceof PasswordConfirmationError ||
      error instanceof OwnedGroupsError ||
      error instanceof UnauthorizedError
    )
      return res.status(error.status_code).json(error.toJSON());
    // Never log request bodies, cookie headers, or error details for this operation.
    return failure(
      res,
      500,
      'InternalServerError',
      'An unexpected error occurred.',
      'Try again later.',
    );
  }
}
