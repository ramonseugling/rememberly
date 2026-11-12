import type { NextApiRequest, NextApiResponse } from 'next';
import { parseSchema, verifyOtpSchema } from '@/lib/validators';
import controller from 'infra/controller';
import passwordReset from 'models/password-reset';

export default controller({
  POST: handlePost,
});

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { email, otp_code } = parseSchema(verifyOtpSchema, req.body);

  const reset_token = await passwordReset.verifyCode(email, otp_code);

  res.status(200).json({ reset_token });
}
