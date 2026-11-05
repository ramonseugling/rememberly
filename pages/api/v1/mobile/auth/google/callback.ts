import controller from '@/infra/controller';
import {
  ServiceError,
  UnauthorizedError,
  ValidationError,
} from '@/infra/errors';
import googleAuth from '@/models/google-auth';
import {
  consumeLoginEmail,
  consumeLoginIp,
  respondToLoginLimit,
} from '@/models/login-rate-limit';
import {
  completeMobileGoogleLogin,
  mobileGoogleCallbackUrl,
  mobileGoogleReturnUrl,
  pendingMobileGoogleLogin,
} from '@/models/mobile-google-login';

export default controller({
  GET: async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    try {
      await consumeLoginIp(req);
      const state = typeof req.query.state === 'string' ? req.query.state : '';
      const cookie = req.cookies.mobile_google_state ?? '';
      const appState = await pendingMobileGoogleLogin(state, cookie);
      res.setHeader(
        'Set-Cookie',
        `mobile_google_state=; HttpOnly; Path=/api/v1/mobile/auth/google; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      );
      if (req.query.error) {
        res.redirect(
          302,
          `${mobileGoogleReturnUrl}?${new URLSearchParams({ state: appState, error: 'cancelled' })}`,
        );
        return;
      }
      const code = req.query.code;
      if (typeof code !== 'string' || !code || code.length > 2048)
        throw new ValidationError({
          message: 'Código do Google inválido.',
          action: 'Tente entrar novamente.',
        });
      const accessToken = await googleAuth.exchangeCodeForTokens(
        code,
        mobileGoogleCallbackUrl(),
      );
      const profile = await googleAuth.getUserProfile(accessToken);
      await consumeLoginEmail(profile.email);
      const user = await googleAuth.findOrCreateUser(profile);
      res.redirect(
        302,
        await completeMobileGoogleLogin(state, cookie, user.id),
      );
    } catch (error) {
      if (respondToLoginLimit(res, error)) return;
      if (
        error instanceof ServiceError ||
        error instanceof UnauthorizedError ||
        error instanceof ValidationError
      )
        throw error;
      throw new ServiceError({
        message: 'Não foi possível concluir o login com Google.',
        action: 'Tente entrar novamente pelo aplicativo.',
      });
    }
  },
});
