import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserSchema, parseSchema } from '@/lib/validators';
import controller from 'infra/controller';
import otp from 'models/otp';
import user from 'models/user';

export default controller({ POST: handlePost });

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { name, email, password, otp_code } = parseSchema(
    createUserSchema,
    req.body,
  );

  const otpRecord = await otp.verify(email, otp_code);

  const createdUser = await user.create({ name, email, password });

  await otp.markAsUsed(otpRecord.id);

  res.status(201).json(createdUser);
}
