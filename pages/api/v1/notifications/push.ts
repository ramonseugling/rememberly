import type { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual } from 'crypto';
import { mobileError, recordMobileFailure } from 'infra/mobile-controller';
import { runPushJob } from 'models/push-delivery';

export const config = { maxDuration: 60 };
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return mobileError(res, 'method', 'GET');
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : '';
  const actual = req.headers.authorization ?? '';
  if (
    !expected ||
    Buffer.byteLength(expected) !== Buffer.byteLength(actual) ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  )
    return mobileError(res, 'session');
  if (process.env.PUSH_DELIVERY_ENABLED !== 'true')
    return res.status(200).json({ disabled: true });
  try {
    return res.status(200).json(await runPushJob());
  } catch {
    recordMobileFailure(req, '/api/v1/notifications/push');
    return mobileError(res, 'internal');
  }
}
