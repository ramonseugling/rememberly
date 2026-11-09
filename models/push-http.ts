import type { NextApiRequest, NextApiResponse } from 'next';
import {
  bearerToken,
  mobileError,
  recordMobileFailure,
} from 'infra/mobile-controller';
import {
  PushSessionError,
  preferences,
  registerDevice,
  removeDevice,
} from 'models/push-devices';
import session from 'models/session';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validInstallation(value: unknown): value is string {
  return typeof value === 'string' && uuid.test(value);
}
export function validExpoToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{1,200}\]$/.test(value)
  );
}
export function pushHandler(kind: 'preferences' | 'register' | 'remove') {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    const allowed =
      kind === 'preferences'
        ? ['GET', 'PATCH']
        : kind === 'register'
          ? ['POST']
          : ['DELETE'];
    if (!allowed.includes(req.method ?? ''))
      return mobileError(res, 'method', allowed.join(', '));
    try {
      const token = bearerToken(req);
      const identity = token ? await session.findOneValidByToken(token) : null;
      if (!identity) return mobileError(res, 'session');
      const keys = Object.keys(req.query);
      if (keys.some((key) => kind !== 'remove' || key !== 'installationId'))
        return mobileError(res, 'query');
      if (kind === 'remove') {
        if (!validInstallation(req.query.installationId)) return invalid(res);
        await removeDevice(identity.user_id, req.query.installationId);
      } else if (kind === 'register') {
        const body = req.body;
        if (
          !body ||
          typeof body !== 'object' ||
          Array.isArray(body) ||
          Object.keys(body).sort().join(',') !==
            'expo_push_token,installation_id,platform' ||
          !validInstallation(body.installation_id) ||
          !validExpoToken(body.expo_push_token) ||
          !['ios', 'android'].includes(body.platform)
        )
          return invalid(res);
        await registerDevice(identity.user_id, identity.id, body);
      } else {
        if (req.method === 'GET')
          return res.status(200).json(await preferences(identity.user_id));
        const body = req.body;
        const allowed = ['push_enabled', 'email_events', 'email_marketing'];
        const keys = body && typeof body === 'object' ? Object.keys(body) : [];
        if (
          !keys.length ||
          keys.some(
            (key) => !allowed.includes(key) || typeof body[key] !== 'boolean',
          )
        )
          return invalid(res);
        return res.status(200).json(await preferences(identity.user_id, body));
      }
      return res.status(204).end();
    } catch (error) {
      if (error instanceof PushSessionError) return mobileError(res, 'session');
      recordMobileFailure(req, '/api/v1/mobile/push');
      return mobileError(res, 'internal');
    }
  };
}
function invalid(res: NextApiResponse) {
  return res.status(400).json({
    name: 'ValidationError',
    message: 'Invalid notification request.',
    action: 'Send only the documented fields with valid values.',
    status_code: 400,
  });
}
