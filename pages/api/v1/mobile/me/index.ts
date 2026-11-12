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
    first_name: identity.first_name ?? null,
    last_name: identity.last_name ?? null,
    email: identity.email,
    birth_day: identity.birth_day,
    birth_month: identity.birth_month,
    birth_year: identity.birth_year,
    avatar_url: identity.avatar_url ?? null,
    has_password: identity.has_password ?? false,
  },
}));

const DELETION_PHRASE = 'Excluir minha conta';

const schema = z
  .object({
    confirmation: z.literal(DELETION_PHRASE),
    password: z.string().min(1).optional(),
    otp_code: z
      .string()
      .regex(/^[0-9]{6}$/)
      .optional(),
  })
  .strict()
  .refine(
    (body) => (body.password === undefined) !== (body.otp_code === undefined),
  );

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
    if (!parsed.success) return null;
    return parsed.data.otp_code !== undefined
      ? { otpCode: parsed.data.otp_code }
      : { password: parsed.data.password! };
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
          'Send the confirmation phrase and either your current password or the e-mailed code as JSON without query parameters.',
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
