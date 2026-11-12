import type { NextApiRequest, NextApiResponse } from 'next';
import session from 'models/session';
import systemLog from 'models/system-log';

const errors = {
  input: [
    'ValidationError',
    'Invalid login request.',
    'Provide a valid email address and a nonempty password.',
    400,
  ],
  login: [
    'UnauthorizedError',
    'Invalid email or password.',
    'Check your credentials and try again.',
    401,
  ],
  session: [
    'UnauthorizedError',
    'A valid Bearer session is required.',
    'Sign in and send your session token in the Authorization header.',
    401,
  ],
  query: [
    'ValidationError',
    'Query parameters are not supported.',
    'Remove query parameters and try again.',
    400,
  ],
  internal: [
    'InternalServerError',
    'An unexpected error occurred.',
    'Try again later.',
    500,
  ],
} as const;

export function mobileError(
  res: NextApiResponse,
  kind: keyof typeof errors | 'method',
  methods = 'GET, POST, DELETE',
) {
  const [name, message, action, status_code] =
    kind === 'method'
      ? ([
          'MethodNotAllowedError',
          'Method not allowed.',
          methods === 'GET' ? 'Use GET.' : 'Use GET, POST, or DELETE.',
          405,
        ] as const)
      : errors[kind];
  if (status_code === 401)
    res.setHeader('WWW-Authenticate', 'Bearer realm="rememberly"');
  if (kind === 'method') res.setHeader('Allow', methods);
  return res.status(status_code).json({ name, message, action, status_code });
}

export function bearerToken(req: NextApiRequest) {
  const count = req.rawHeaders.filter(
    (header, index) =>
      index % 2 === 0 && header.toLowerCase() === 'authorization',
  ).length;
  if (count !== 1) return null;
  const match = req.headers.authorization
    ?.trim()
    .match(/^([a-z]+) +([0-9a-f]{96})$/i);
  if (
    !match ||
    match[1].toLowerCase() !== 'bearer' ||
    !/^[0-9a-f]{96}$/.test(match[2])
  )
    return null;
  return match[2];
}

export function recordMobileFailure(req: NextApiRequest, path: string) {
  // Raw database errors and URLs can contain credentials or personal data.
  void systemLog.recordError({
    error: new Error('Mobile API operation failed.'),
    request_method: req.method,
    request_path: path,
  });
}

export interface MobileIdentity {
  user_id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
  avatar_url?: string | null;
  has_password?: boolean;
}

export function mobileGet(
  path: string,
  handle: (identity: MobileIdentity) => Promise<unknown>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') return mobileError(res, 'method', 'GET');
    try {
      const token = bearerToken(req);
      if (!token) return mobileError(res, 'session');
      const found = await session.findOneValidByToken(token);
      if (!found) return mobileError(res, 'session');
      if (Object.keys(req.query).length) return mobileError(res, 'query');
      return res.status(200).json(await handle(found));
    } catch {
      recordMobileFailure(req, path);
      return mobileError(res, 'internal');
    }
  };
}
