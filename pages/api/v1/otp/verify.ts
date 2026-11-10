import type { NextApiRequest, NextApiResponse } from 'next';
import { parseSchema, verifyOtpSchema } from '@/lib/validators';
import controller from 'infra/controller';
import emailVerification from 'models/email-verification';
import otp from 'models/otp';

export default controller({ POST: handlePost });

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { email, otp_code } = parseSchema(verifyOtpSchema, req.body);

  const otpRecord = await otp.verify(email, otp_code);
  await otp.markAsUsed(otpRecord.id);

  res
    .status(200)
    .json({ verification_token: await emailVerification.create(email) });
}
