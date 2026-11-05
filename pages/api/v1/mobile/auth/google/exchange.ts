import { z } from 'zod';
import controller from '@/infra/controller';
import { ValidationError } from '@/infra/errors';
import { consumeLoginIp, respondToLoginLimit } from '@/models/login-rate-limit';
import { exchangeMobileGoogleLogin } from '@/models/mobile-google-login';

const schema = z
  .object({
    code: z.string().regex(/^[a-f0-9]{64}$/),
    state: z.string().regex(/^[a-f0-9]{64}$/),
    code_verifier: z.string().regex(/^[A-Za-z0-9._~-]{43,128}$/),
  })
  .strict();
export const config = { api: { bodyParser: { sizeLimit: '2kb' } } };

export default controller({
  POST: async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      await consumeLoginIp(req);
    } catch (error) {
      if (respondToLoginLimit(res, error)) return;
      throw error;
    }
    const parsed = schema.safeParse(req.body);
    if (
      !parsed.success ||
      Object.keys(req.query).length ||
      req.headers['content-type']?.split(';')[0] !== 'application/json'
    ) {
      throw new ValidationError({
        message: 'Pedido de login inválido.',
        action: 'Tente entrar novamente pelo aplicativo.',
      });
    }
    res
      .status(201)
      .json(
        await exchangeMobileGoogleLogin(
          parsed.data.code,
          parsed.data.code_verifier,
          parsed.data.state,
        ),
      );
  },
});
