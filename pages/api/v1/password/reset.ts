import type { NextApiRequest, NextApiResponse } from 'next';
import { parseSchema, resetPasswordSchema } from '@/lib/validators';
import controller from 'infra/controller';
import passwordReset from 'models/password-reset';

export default controller({
  POST: handlePost,
});

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { token, password } = parseSchema(resetPasswordSchema, req.body);

  await passwordReset.resetPassword(token, password);

  res.status(200).json({ message: 'Senha redefinida com sucesso.' });
}
