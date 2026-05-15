import { log } from 'next-axiom';
import database from 'infra/database';
import email from 'models/email';
import systemLog from 'models/system-log';

interface TodayEvent {
  event_title: string;
  event_type: string;
  event_custom_type: string | null;
  user_name: string;
  user_email: string;
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
  const start_time = Date.now();
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

  // 2. Group member birthdays → notify all group members (deduplicated by person+recipient)
  const groupBirthdayResult = await database.query(
    `SELECT
       birthday_user.name AS event_title,
       'birthday' AS event_type,
       NULL AS event_custom_type,
       recipient.name AS user_name,
       recipient.email AS user_email
     FROM group_members birthday_member
     JOIN users birthday_user ON birthday_user.id = birthday_member.user_id
     JOIN group_members recipient_member ON recipient_member.group_id = birthday_member.group_id
       AND recipient_member.user_id != birthday_member.user_id
     JOIN users recipient ON recipient.id = recipient_member.user_id
     WHERE birthday_user.birth_day = $1
       AND birthday_user.birth_month = $2
     GROUP BY birthday_user.id, birthday_user.name, recipient.id, recipient.name, recipient.email`,
    [day, month],
  );

  const personalEvents: TodayEvent[] = personalResult.rows;
  const groupBirthdays: TodayEvent[] = groupBirthdayResult.rows;

  const allEvents = [...personalEvents, ...groupBirthdays];

  log.info('cron_notifications_start', {
    day,
    month,
    personal: personalEvents.length,
    group_birthdays: groupBirthdays.length,
    total: allEvents.length,
  });

  let sent = 0;
  let failed = 0;

  for (const event of allEvents) {
    try {
      const eventTitle = event.event_title;

      await email.sendEventNotification({
        to: event.user_email,
        userName: event.user_name,
        eventTitle,
        eventType: event.event_type,
        customType: event.event_custom_type,
      });
      sent++;
    } catch (err) {
      failed++;
      log.error('cron_notification_failed', {
        to: event.user_email,
        eventTitle: event.event_title,
        error: String(err),
      });
    }
  }

  log.info('cron_notifications_done', { sent });

  await systemLog.recordCronRun({
    job_name: 'notifications_send',
    status: failed === 0 ? 'success' : sent === 0 ? 'failed' : 'partial',
    metrics: {
      day,
      month,
      personal: personalEvents.length,
      group_birthdays: groupBirthdays.length,
      total: allEvents.length,
      sent,
      failed,
    },
    duration_ms: Date.now() - start_time,
  });

  return { sent };
}

async function sendReminderNotifications() {
  const start_time = Date.now();
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
  let failed = 0;

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
      failed++;
      log.error('cron_reminder_failed', {
        to: event.user_email,
        eventTitle: event.event_title,
        daysUntil: event.reminder_days_before,
        error: String(err),
      });
    }
  }

  log.info('cron_reminders_done', { sent });

  await systemLog.recordCronRun({
    job_name: 'notifications_reminders',
    status: failed === 0 ? 'success' : sent === 0 ? 'failed' : 'partial',
    metrics: {
      total: events.length,
      sent,
      failed,
    },
    duration_ms: Date.now() - start_time,
  });

  return { sent };
}

const notification = { sendTodayNotifications, sendReminderNotifications };

export default notification;
