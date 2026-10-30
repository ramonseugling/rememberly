import type { NextApiRequest, NextApiResponse } from 'next';
import { createSessionSchema } from '@/lib/validators';
import { UnauthorizedError } from 'infra/errors';
import session from 'models/session';
import systemLog from 'models/system-log';

export const config = { api: { bodyParser: false } };

const errors = {
  input: {
    name: 'ValidationError',
    message: 'Invalid login request.',
    action: 'Provide a valid email address and a nonempty password.',
    status_code: 400,
  },
  login: {
    name: 'UnauthorizedError',
    message: 'Invalid email or password.',
    action: 'Check your credentials and try again.',
    status_code: 401,
  },
  session: {
    name: 'UnauthorizedError',
    message: 'A valid Bearer session is required.',
    action: 'Sign in and send your session token in the Authorization header.',
    status_code: 401,
  },
  method: {
    name: 'MethodNotAllowedError',
    message: 'Method not allowed.',
    action: 'Use GET, POST, or DELETE.',
    status_code: 405,
  },
  internal: {
    name: 'InternalServerError',
    message: 'An unexpected error occurred.',
    action: 'Try again later.',
    status_code: 500,
  },
};

function fail(res: NextApiResponse, kind: keyof typeof errors) {
  const error = errors[kind];
  if (error.status_code === 401) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="rememberly"');
  }
  return res.status(error.status_code).json(error);
}

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

function bearerToken(req: NextApiRequest) {
  const count = req.rawHeaders.filter(
    (header, index) =>
      index % 2 === 0 && header.toLowerCase() === 'authorization',
  ).length;
  if (count !== 1) return null;

  const header = req.headers.authorization?.trim();
  const match = header?.match(/^([a-z]+) +([0-9a-f]{96})$/i);
  if (
    !match ||
    match[1].toLowerCase() !== 'bearer' ||
    !/^[0-9a-f]{96}$/.test(match[2])
  ) {
    return null;
  }
  return match[2];
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
    // Database errors may contain credentials; persist only sanitized context.
    void systemLog.recordError({
      error: new Error('Mobile session operation failed.'),
      request_method: req.method,
      request_path: '/api/v1/mobile/sessions',
    });
    return fail(res, 'internal');
  }
}
