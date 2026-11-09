import type { NextApiRequest, NextApiResponse } from 'next';
import {
  bearerToken,
  mobileError,
  recordMobileFailure,
} from 'infra/mobile-controller';
import email from 'models/email';
import {
  consumeLoginEmail,
  consumeLoginIp,
  respondToLoginLimit,
} from 'models/login-rate-limit';
import otp from 'models/otp';
import session from 'models/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return mobileError(res, 'method', 'POST');
  }
  try {
    const token = bearerToken(req);
    const identity = token ? await session.findOneValidByToken(token) : null;
    if (!identity) return mobileError(res, 'session');
    if (Object.keys(req.query).length) return mobileError(res, 'query');
    try {
      await consumeLoginIp(req);
      await consumeLoginEmail(identity.email);
    } catch (error) {
      if (respondToLoginLimit(res, error)) return;
      throw error;
    }
    const record = await otp.create(identity.email);
    await email.sendAccountDeletionCodeEmail({
      to: identity.email,
      code: record.code,
    });
    return res.status(204).end();
  } catch {
    recordMobileFailure(req, '/api/v1/mobile/me/deletion-code');
    return mobileError(res, 'internal');
  }
}
