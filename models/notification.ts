import { log } from 'next-axiom';
import database from 'infra/database';
import email from 'models/email';

interface TodayEvent {
  event_title: string;
  event_type: string;
  event_custom_type: string | null;
  user_name: string;
  user_email: string;
  group_name?: string | null;
}

interface ReminderEvent {
  event_title: string;
  event_type: string;
  event_custom_type: string | null;
  reminder_days_before: number;
  user_name: string;
  user_email: string;
}

const REMINDER_INTERVALS = [1, 3, 7, 15, 30];

async function sendTodayNotifications() {
  const today = new Date();
  const day = today.getUTCDate();
  const month = today.getUTCMonth() + 1;

  // 1. Personal events
  const personalResult = await database.query(
    `SELECT
       e.title AS event_title,
       e.type AS event_type,
       e.custom_type AS event_custom_type,
       u.name AS user_name,
       u.email AS user_email
     FROM events e
     JOIN users u ON u.id = e.user_id
     WHERE e.event_day = $1
       AND e.event_month = $2`,
    [day, month],
  );

  // 2. Group events → notify all group members
  const groupEventResult = await database.query(
    `SELECT
       ge.title AS event_title,
       ge.type AS event_type,
       ge.custom_type AS event_custom_type,
       g.name AS group_name,
       u.name AS user_name,
       u.email AS user_email
     FROM group_events ge
     JOIN groups g ON g.id = ge.group_id
     JOIN group_members gm ON gm.group_id = ge.group_id
     JOIN users u ON u.id = gm.user_id
     WHERE ge.event_day = $1
       AND ge.event_month = $2`,
    [day, month],
  );

  const personalEvents: TodayEvent[] = personalResult.rows;
  const groupEvents: TodayEvent[] = groupEventResult.rows;

  const allEvents = [...personalEvents, ...groupEvents];

  log.info('cron_notifications_start', {
    day,
    month,
    personal: personalEvents.length,
    group_events: groupEvents.length,
    total: allEvents.length,
  });

  let sent = 0;

  for (const event of allEvents) {
    try {
      const eventTitle = event.group_name
        ? `${event.event_title} (Grupo: ${event.group_name})`
        : event.event_title;

      await email.sendEventNotification({
        to: event.user_email,
        userName: event.user_name,
        eventTitle,
        eventType: event.event_type,
        customType: event.event_custom_type,
      });
      sent++;
    } catch (err) {
      log.error('cron_notification_failed', {
        to: event.user_email,
        eventTitle: event.event_title,
        error: String(err),
      });
    }
  }

  log.info('cron_notifications_done', { sent });

  return { sent };
}

async function sendReminderNotifications() {
  const today = new Date();

  const futureDates = REMINDER_INTERVALS.map((days) => {
    const future = new Date(today);
    future.setUTCDate(future.getUTCDate() + days);
    return {
      days,
      day: future.getUTCDate(),
      month: future.getUTCMonth() + 1,
    };
  });

  const conditions = futureDates
    .map(
      (_, i) =>
        `(e.reminder_days_before = $${i * 3 + 1} AND e.event_day = $${i * 3 + 2} AND e.event_month = $${i * 3 + 3})`,
    )
    .join('\n       OR ');

  const params = futureDates.flatMap((f) => [f.days, f.day, f.month]);

  const result = await database.query(
    `SELECT
       e.title AS event_title,
       e.type AS event_type,
       e.custom_type AS event_custom_type,
       e.reminder_days_before,
       u.name AS user_name,
       u.email AS user_email
     FROM events e
     JOIN users u ON u.id = e.user_id
     WHERE e.reminder_days_before > 0
       AND (${conditions})`,
    params,
  );

  const events: ReminderEvent[] = result.rows;

  log.info('cron_reminders_start', { total: events.length });

  let sent = 0;

  for (const event of events) {
    try {
      await email.sendReminderNotification({
        to: event.user_email,
        userName: event.user_name,
        eventTitle: event.event_title,
        eventType: event.event_type,
        customType: event.event_custom_type,
        daysUntil: event.reminder_days_before,
      });
      sent++;
    } catch (err) {
      log.error('cron_reminder_failed', {
        to: event.user_email,
        eventTitle: event.event_title,
        daysUntil: event.reminder_days_before,
        error: String(err),
      });
    }
  }

  log.info('cron_reminders_done', { sent });

  return { sent };
}

const notification = { sendTodayNotifications, sendReminderNotifications };

export default notification;
