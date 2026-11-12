import { log } from 'next-axiom';
import { randomUUID } from 'node:crypto';
import database from 'infra/database';
import email from 'models/email';
import { enqueuePush } from 'models/push-delivery';

interface ReleasedInput {
  reserverId: string;
  ownerId: string;
  giftTitle: string;
  action: 'edited' | 'deleted';
}

// Best effort: the owner's change already happened, so a failed notification
// must not turn the request into an error.
async function notifyReleased(input: ReleasedInput) {
  try {
    await enqueuePush(input.reserverId, `gift-released:${randomUUID()}`, {
      kind: 'gift_released',
      user_id: input.ownerId,
    });
    const recipient = await database.query(
      `SELECT COALESCE(r.first_name, r.name) AS user_name, r.email, o.name AS owner_name
       FROM users r JOIN users o ON o.id = $2
       LEFT JOIN notification_preferences np ON np.user_id = r.id
       WHERE r.id = $1 AND COALESCE(np.email_events, true)`,
      [input.reserverId, input.ownerId],
    );
    const row = recipient.rows[0];
    if (!row) return;
    await email.sendGiftReleasedEmail({
      to: row.email,
      userName: row.user_name,
      ownerName: row.owner_name,
      giftTitle: input.giftTitle,
      action: input.action,
    });
  } catch (error) {
    log.error('gift_released_notification_failed', { error: String(error) });
  }
}

const giftNotification = { notifyReleased };

export default giftNotification;
