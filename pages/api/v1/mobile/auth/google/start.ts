import controller from '@/infra/controller';
import { ValidationError } from '@/infra/errors';
import googleAuth from '@/models/google-auth';
import { consumeLoginIp, respondToLoginLimit } from '@/models/login-rate-limit';
import {
  mobileGoogleCallbackUrl,
  startMobileGoogleLogin,
} from '@/models/mobile-google-login';

export default controller({
  GET: async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    try {
      await consumeLoginIp(req);
    } catch (error) {
      if (respondToLoginLimit(res, error)) return;
      throw error;
    }
    const { state, code_challenge } = req.query;
    if (
      typeof state !== 'string' ||
      typeof code_challenge !== 'string' ||
      Object.keys(req.query).length !== 2
    ) {
      throw new ValidationError({
        message: 'Pedido de login inválido.',
        action: 'Tente novamente pelo aplicativo.',
      });
    }
    const callback = mobileGoogleCallbackUrl();
    const oauthState = await startMobileGoogleLogin(state, code_challenge);
    res.setHeader(
      'Set-Cookie',
      `mobile_google_state=${oauthState}; HttpOnly; Path=/api/v1/mobile/auth/google; SameSite=Lax; Max-Age=300${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    );
    res.redirect(302, googleAuth.getAuthorizationUrl(oauthState, callback));
  },
});
