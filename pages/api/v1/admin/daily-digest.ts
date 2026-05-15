import type { NextApiRequest, NextApiResponse } from 'next';
import controller from 'infra/controller';
import { UnauthorizedError } from 'infra/errors';
import digest from 'models/digest';

export default controller({
  GET: handleGet,
});

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const authorization = req.headers.authorization;

  if (
    !process.env.CRON_SECRET ||
    authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    throw new UnauthorizedError({
      message: 'Token do cron inválido ou ausente.',
      action: 'Forneça o CRON_SECRET válido no header Authorization.',
    });
  }

  const result = await digest.sendDailyDigest();
  res.status(200).json(result);
}
