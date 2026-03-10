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

  const result = await passwordReset.createToken(userEmail);

  if (result) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${result.token}`;
    await email.sendPasswordResetEmail({
      to: result.user.email,
      userName: result.user.name,
      resetUrl,
    });
  }

  res.status(200).json({
    message:
      'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
  });
}
