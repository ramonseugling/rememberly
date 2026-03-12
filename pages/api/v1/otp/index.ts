import type { NextApiRequest, NextApiResponse } from 'next';
import { createOtpSchema, parseSchema } from '@/lib/validators';
import controller from 'infra/controller';
import { ValidationError } from 'infra/errors';
import email from 'models/email';
import otp from 'models/otp';
import user from 'models/user';

export default controller({ POST: handlePost });

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { email: emailAddress } = parseSchema(createOtpSchema, req.body);

  const existingUser = await user.findOneByEmail(emailAddress);

  if (existingUser) {
    throw new ValidationError({
      message: 'Este e-mail já está em uso.',
      action: 'Utilize outro e-mail ou faça login.',
    });
  }

  const otpRecord = await otp.create(emailAddress);

  await email.sendOtpEmail({
    to: emailAddress,
    code: otpRecord.code,
  });

  res.status(201).json({ message: 'Código enviado com sucesso.' });
}
