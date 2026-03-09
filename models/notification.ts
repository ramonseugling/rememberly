import database from 'infra/database';
import email from 'models/email';

interface TodayEvent {
  event_title: string;
  event_type: string;
  user_name: string;
  user_email: string;
}

async function sendTodayNotifications() {
  const today = new Date();
  const day = today.getUTCDate();
  const month = today.getUTCMonth() + 1;

  const result = await database.query(
    `SELECT
       e.title AS event_title,
       e.type AS event_type,
       u.name AS user_name,
       u.email AS user_email
     FROM events e
     JOIN users u ON u.id = e.user_id
     WHERE e.event_day = $1
       AND e.event_month = $2`,
    [day, month],
  );

  const events: TodayEvent[] = result.rows;

  for (const event of events) {
    await email.sendEventNotification({
      to: event.user_email,
      userName: event.user_name,
      eventTitle: event.event_title,
      eventType: event.event_type,
    });
  }

  return { sent: events.length };
}

const notification = { sendTodayNotifications };

export default notification;
