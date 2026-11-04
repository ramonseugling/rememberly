import type { NextApiRequest, NextApiResponse } from 'next';
import controller from 'infra/controller';
import { UnauthorizedError } from 'infra/errors';
import notification from 'models/notification';
import { runPushJob } from 'models/push-delivery';
import systemLog from 'models/system-log';

export const config = { maxDuration: 60 };

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

  const result = await notification.sendTodayNotifications();
  if (process.env.PUSH_DELIVERY_ENABLED === 'true') {
    const started = Date.now();
    try {
      const metrics = await runPushJob();
      await systemLog.recordCronRun({
        job_name: 'push_notifications',
        status: 'success',
        metrics,
        duration_ms: Date.now() - started,
      });
    } catch {
      // Push failure must not change the existing email response or expose tokens.
      await systemLog.recordError({
        error: new Error('Daily push processing failed.'),
        request_method: 'GET',
        request_path: '/api/v1/notifications/send',
      });
    }
  }
  res.status(200).json(result);
}
