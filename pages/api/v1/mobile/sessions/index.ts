import type { NextApiRequest, NextApiResponse } from 'next';
import { createSessionSchema } from '@/lib/validators';
import { UnauthorizedError } from 'infra/errors';
import {
  bearerToken,
  mobileError as fail,
  recordMobileFailure,
} from 'infra/mobile-controller';
import session from 'models/session';

export const config = { api: { bodyParser: false } };

async function readLogin(req: NextApiRequest) {
  const contentType = req.headers['content-type']?.split(';')[0].trim();
  if (contentType?.toLowerCase() !== 'application/json') return null;

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 16 * 1024) return null;
    chunks.push(buffer);
  }

  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
  const parsed = createSessionSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['POST', 'GET', 'DELETE'].includes(req.method ?? '')) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return fail(res, 'method');
  }

  try {
    if (req.method === 'POST') {
      const login = await readLogin(req);
      if (!login) return fail(res, 'input');

      let created;
      try {
        created = await session.createPersistent(login.email, login.password);
      } catch (error) {
        if (error instanceof UnauthorizedError) return fail(res, 'login');
        throw error;
      }
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
    }

    const token = bearerToken(req);
    if (!token) return fail(res, 'session');

    if (req.method === 'DELETE') {
      await session.expireByToken(token);
      return res.status(204).end();
    }

    const found = await session.findOneValidByToken(token);
    if (!found) return fail(res, 'session');
    return res.status(200).json({
      expires_at: found.expires_at,
      user: { id: found.user_id, name: found.name, email: found.email },
    });
  } catch {
    recordMobileFailure(req, '/api/v1/mobile/sessions');
    return fail(res, 'internal');
  }
}
