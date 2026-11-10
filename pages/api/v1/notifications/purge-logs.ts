import type { NextApiRequest, NextApiResponse } from 'next';
import controller from 'infra/controller';
import { UnauthorizedError } from 'infra/errors';
import { purgeOldLogs } from 'models/log-retention';

export default controller({
  GET: handleGet,
});

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    throw new UnauthorizedError({
      message: 'Token do cron inválido ou ausente.',
      action: 'Forneça o CRON_SECRET válido no header Authorization.',
    });
  }

  res.status(200).json(await purgeOldLogs());
}
