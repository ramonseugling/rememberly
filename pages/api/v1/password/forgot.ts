import type { NextApiRequest, NextApiResponse } from 'next';
import { forgotPasswordSchema, parseSchema } from '@/lib/validators';
import controller from 'infra/controller';
import email from 'models/email';
import passwordReset from 'models/password-reset';

export default controller({
  POST: handlePost,
});

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { email: userEmail } = parseSchema(forgotPasswordSchema, req.body);

  const result = await passwordReset.requestCode(userEmail);

  if (result && 'googleOnly' in result) {
    return res.status(200).json({
      message:
        'Esta conta foi criada com o Google. Use o botão "Entrar com Google" para entrar.',
      google_only: true,
    });
  }

  if (result && 'code' in result) {
    await email.sendOtpEmail({
      to: result.user.email,
      code: result.code,
      purpose: 'password_reset',
    });
  }

  res.status(200).json({
    message:
      'Se este e-mail estiver cadastrado, você receberá um código para redefinir sua senha.',
  });
}
