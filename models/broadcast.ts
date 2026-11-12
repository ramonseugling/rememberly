import { log } from 'next-axiom';
import { getAnnouncement } from '@/lib/announcements';
import { makeUnsubscribeToken } from '@/lib/unsubscribe-token';
import database from 'infra/database';
import { NotFoundError } from 'infra/errors';
import email from 'models/email';
import systemLog from 'models/system-log';

const APP_URL = process.env.APP_URL ?? 'https://www.rememberly.com.br';

interface Recipient {
  id: string;
  name: string;
  email: string;
}

async function getRecipients(announcementKey: string): Promise<Recipient[]> {
  const result = await database.query(
    `SELECT u.id, COALESCE(u.first_name, u.name) AS name, u.email FROM users u
     LEFT JOIN notification_preferences np ON np.user_id = u.id
     WHERE COALESCE(np.email_marketing, u.marketing_consent)
       AND NOT EXISTS (
         SELECT 1 FROM broadcast_deliveries d
         WHERE d.user_id = u.id AND d.announcement_key = $1
       )`,
    [announcementKey],
  );

  return result.rows;
}

async function countRecipients(announcementKey: string): Promise<number> {
  const result = await database.query(
    `SELECT COUNT(*)::int AS count FROM users u
     LEFT JOIN notification_preferences np ON np.user_id = u.id
     WHERE COALESCE(np.email_marketing, u.marketing_consent)
       AND NOT EXISTS (
         SELECT 1 FROM broadcast_deliveries d
         WHERE d.user_id = u.id AND d.announcement_key = $1
       )`,
    [announcementKey],
  );

  return result.rows[0]?.count ?? 0;
}

async function sendAnnouncement(announcementKey: string) {
  const announcement = getAnnouncement(announcementKey);

  if (!announcement) {
    throw new NotFoundError({
      message: 'Anúncio não encontrado.',
      action: 'Verifique a chave do anúncio e tente novamente.',
    });
  }

  const start_time = Date.now();
  const recipients = await getRecipients(announcementKey);

  log.info('broadcast_start', {
    announcementKey,
    total: recipients.length,
  });

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];

    try {
      const unsubscribeToken = makeUnsubscribeToken(recipient.id);
      const unsubscribeUrl = `${APP_URL}/api/v1/unsubscribe?token=${unsubscribeToken}`;

      await email.sendAnnouncementEmail({
        to: recipient.email,
        userName: recipient.name,
        announcement,
        unsubscribeUrl,
      });

      await database.query(
        `INSERT INTO broadcast_deliveries (user_id, announcement_key)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [recipient.id, announcementKey],
      );

      sent++;
    } catch (err) {
      failed++;
      log.error('broadcast_send_failed', {
        announcementKey,
        error: String(err),
      });
    }

    // Throttle: pause every 10 sends to respect rate limits
    if ((i + 1) % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const total = recipients.length;
  const status = failed === 0 ? 'success' : sent === 0 ? 'failed' : 'partial';

  log.info('broadcast_done', { announcementKey, sent, failed, total });

  await systemLog.recordCronRun({
    job_name: `broadcast_${announcementKey}`,
    status,
    metrics: { sent, failed, total },
    duration_ms: Date.now() - start_time,
  });

  return { sent, failed, total };
}

const broadcast = {
  getRecipients,
  countRecipients,
  sendAnnouncement,
};

export default broadcast;
