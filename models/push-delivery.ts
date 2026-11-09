import crypto from 'crypto';
import { COMMEMORATIVE_DATES } from '@/lib/commemorative-dates';
import {
  annualOccurrence,
  commemorativeOccurrence,
  dateOnly,
  referenceDay,
} from '@/lib/mobile-calendar';
import database from 'infra/database';
import { type PushProvider, expoProvider } from 'models/push-provider';

const eligible = `d.disabled_at IS NULL AND p.push_events=true AND s.user_id=d.user_id
 AND (s.expires_at IS NULL OR s.expires_at>now())`;
export async function enqueuePushReminders(today = referenceDay()) {
  const day = dateOnly(today);
  const events = await database.query(
    'SELECT id,user_id,event_day,event_month,reminder_days_before FROM events',
  );
  const reminders: {
    user_id: string;
    key: string;
    data: Record<string, string>;
  }[] = [];
  for (const e of events.rows) {
    const occurrence = annualOccurrence(e.event_day, e.event_month, today);
    if (
      occurrence.days_until === 0 ||
      ([1, 3, 7, 15, 30].includes(e.reminder_days_before) &&
        occurrence.days_until === e.reminder_days_before)
    )
      reminders.push({
        user_id: e.user_id,
        key: `event:${e.id}:${day}`,
        data: { kind: 'event', event_id: e.id },
      });
  }
  const birthdays = await database.query(
    `SELECT DISTINCT recipient.user_id,b.id AS birthday_id FROM group_members member
    JOIN users b ON b.id=member.user_id JOIN group_members recipient ON recipient.group_id=member.group_id
    AND recipient.user_id<>member.user_id WHERE b.birth_day=$1 AND b.birth_month=$2`,
    [today.getUTCDate(), today.getUTCMonth() + 1],
  );
  for (const b of birthdays.rows)
    reminders.push({
      user_id: b.user_id,
      key: `birthday:${b.birthday_id}:${day}`,
      data: { kind: 'birthday', user_id: b.birthday_id },
    });
  const keys = COMMEMORATIVE_DATES.filter(
    (def) => commemorativeOccurrence(def, today).days_until === 7,
  ).map((def) => def.key);
  if (keys.length) {
    const subscriptions = await database.query(
      'SELECT user_id,date_key FROM commemorative_subscriptions WHERE date_key=ANY($1::text[])',
      [keys],
    );
    for (const s of subscriptions.rows)
      reminders.push({
        user_id: s.user_id,
        key: `commemorative:${s.date_key}:${day}`,
        data: { kind: 'commemorative', date_key: s.date_key },
      });
  }
  let enqueued = 0;
  for (const reminder of reminders) {
    const result = await database.query(
      `INSERT INTO push_deliveries(device_id,user_id,session_id,dedup_key,data)
      SELECT d.id,d.user_id,d.session_id,$2,$3::jsonb FROM push_devices d
      JOIN notification_preferences p ON p.user_id=d.user_id JOIN sessions s ON s.id=d.session_id
      WHERE d.user_id=$1 AND ${eligible} ON CONFLICT(device_id,dedup_key) DO NOTHING`,
      [reminder.user_id, reminder.key, JSON.stringify(reminder.data)],
    );
    enqueued += result.rowCount ?? 0;
  }
  return enqueued;
}
async function claim(limit: number) {
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    // An abandoned network call is ambiguous: do not automatically resend it.
    await client.query(`UPDATE push_deliveries SET status='failed',last_error='UnknownOutcome',updated_at=now()
      WHERE status='sending' AND lease_until<now()`);
    await client.query(`UPDATE push_attempts a SET finished_at=now(),outcome='UnknownOutcome'
      FROM push_deliveries q WHERE q.id=a.delivery_id AND q.last_error='UnknownOutcome' AND a.finished_at IS NULL`);
    await client.query(`UPDATE push_deliveries q SET status='cancelled',updated_at=now() WHERE q.status='pending' AND NOT EXISTS(
      SELECT 1 FROM push_devices d JOIN notification_preferences p ON p.user_id=d.user_id
      JOIN sessions s ON s.id=d.session_id WHERE d.id=q.device_id AND d.session_id=q.session_id
      AND d.user_id=q.user_id AND ${eligible})`);
    await client.query(`UPDATE push_deliveries SET status='failed',last_error='Expired',updated_at=now()
      WHERE status='pending' AND created_at<now()-interval '24 hours'`);
    const selected = await client.query(
      `SELECT q.id FROM push_deliveries q WHERE status='pending'
      AND available_at<=now() AND attempts<3 ORDER BY created_at,id LIMIT $1 FOR UPDATE SKIP LOCKED`,
      [limit],
    );
    if (!selected.rowCount) {
      await client.query('COMMIT');
      return [];
    }
    const lease = crypto.randomUUID();
    const claimed = await client.query(
      `UPDATE push_deliveries SET status='sending',attempts=attempts+1,
      lease_id=$2,lease_until=now()+interval '2 minutes',updated_at=now() WHERE id=ANY($1::uuid[]) RETURNING *`,
      [selected.rows.map((row) => row.id), lease],
    );
    await client.query(
      `INSERT INTO push_attempts(delivery_id,attempt) SELECT id,attempts FROM push_deliveries WHERE lease_id=$1 AND status='sending'`,
      [lease],
    );
    await client.query('COMMIT');
    return claimed.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
async function deliverBatch(provider: PushProvider) {
  const claimed = await claim(provider.sendBatch ? 100 : 4);
  if (!claimed.length) return 0;
  // Recheck session binding and opt-in immediately before the external request.
  const current = await database.query(
    `SELECT q.*,d.expo_push_token FROM push_deliveries q
    JOIN push_devices d ON d.id=q.device_id AND d.user_id=q.user_id AND d.session_id=q.session_id
    JOIN notification_preferences p ON p.user_id=d.user_id JOIN sessions s ON s.id=d.session_id
    WHERE q.id=ANY($1::uuid[]) AND q.status='sending' AND ${eligible}`,
    [claimed.map((row) => row.id)],
  );
  const ids = new Set(current.rows.map((row) => row.id));
  for (const row of claimed)
    if (!ids.has(row.id)) await finish(row, 'cancelled', 'Ineligible');
  const messages = current.rows.map((row) => ({
    to: row.expo_push_token,
    title: 'Rememberly',
    channelId: 'reminders' as const,
    body: 'You have a date to remember. Open Rememberly to see it.',
    data: row.data,
  }));
  let results: Awaited<ReturnType<PushProvider['send']>>[];
  try {
    results = provider.sendBatch
      ? await provider.sendBatch(messages)
      : await Promise.all(messages.map((message) => provider.send(message)));
  } catch {
    results = messages.map(() => ({ status: 'unknown' }));
  }
  for (let index = 0; index < current.rows.length; index++) {
    const row = current.rows[index];
    const result = results[index] ?? { status: 'unknown' };
    if (result.status === 'accepted')
      await finish(row, 'ticket', 'Accepted', result.id);
    else if (result.status === 'unknown')
      await finish(row, 'failed', 'UnknownOutcome');
    else {
      if (result.code === 'DeviceNotRegistered')
        await database.query(
          'UPDATE push_devices SET disabled_at=now() WHERE id=$1 AND expo_push_token=$2 AND session_id=$3',
          [row.device_id, row.expo_push_token, row.session_id],
        );
      await finish(
        row,
        result.retryable && row.attempts < 3 ? 'pending' : 'failed',
        result.code,
      );
    }
  }
  return current.rows.length;
}
async function finish(
  row: { id: string; lease_id: string; attempts: number },
  status: string,
  outcome: string,
  ticket?: string,
) {
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE push_deliveries SET status=$3,last_error=$4,ticket_id=$5,lease_until=NULL,
      available_at=now()+interval '15 minutes',updated_at=now() WHERE id=$1 AND lease_id=$2 AND status='sending'`,
      [row.id, row.lease_id, status, outcome, ticket ?? null],
    );
    await client.query(
      'UPDATE push_attempts SET finished_at=now(),outcome=$3 WHERE delivery_id=$1 AND attempt=$2',
      [row.id, row.attempts, outcome],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
async function checkReceipts(provider: PushProvider) {
  await database.query(`UPDATE push_deliveries SET status='failed',last_error='ReceiptUnknown',updated_at=now()
    WHERE status='ticket' AND receipt_checks>=3 AND (lease_until IS NULL OR lease_until<now())`);
  // Claim receipt batches with a lease, so overlapping cron calls share durable limits.
  const claimed = await database.query(
    `UPDATE push_deliveries SET receipt_checks=receipt_checks+1,
    lease_until=now()+interval '2 minutes',lease_id=$1,updated_at=now()
    WHERE id IN (SELECT id FROM push_deliveries WHERE status='ticket' AND receipt_checks<3
      AND (lease_until IS NULL OR lease_until<now()) AND available_at<=now()
      ORDER BY created_at LIMIT 50 FOR UPDATE SKIP LOCKED) RETURNING *`,
    [crypto.randomUUID()],
  );
  if (!claimed.rowCount) return 0;
  let receipts: Awaited<ReturnType<PushProvider['receipts']>> = {};
  try {
    receipts = await provider.receipts(
      claimed.rows.map((row) => row.ticket_id),
    );
  } catch {
    /* Retry within the durable bounded receipt budget. */
  }
  for (const row of claimed.rows) {
    const receipt = receipts[row.ticket_id] ?? { status: 'pending' };
    const status =
      receipt.status === 'ok'
        ? 'delivered'
        : receipt.status === 'error' || row.receipt_checks >= 3
          ? 'failed'
          : 'ticket';
    const code =
      receipt.status === 'error'
        ? receipt.code
        : receipt.status === 'pending'
          ? 'ReceiptUnknown'
          : null;
    // Provider codes are allowlisted in the production transport; never persist raw messages.
    await database.query(
      `UPDATE push_deliveries SET status=$3,last_error=$4,lease_until=NULL,
      available_at=now()+interval '15 minutes',updated_at=now() WHERE id=$1 AND lease_id=$2 AND status='ticket'`,
      [row.id, row.lease_id, status, code],
    );
    if (receipt.status === 'error' && receipt.code === 'DeviceNotRegistered')
      await database.query(
        'UPDATE push_devices SET disabled_at=now() WHERE id=$1 AND session_id=$2 AND updated_at<=$3',
        [row.device_id, row.session_id, row.created_at],
      );
  }
  return claimed.rowCount ?? 0;
}
/** Direct model tests inject transport; HTTP scheduling must enforce PUSH_DELIVERY_ENABLED. */
export async function runPushJob(
  provider: PushProvider = expoProvider,
  today = referenceDay(),
) {
  const start = Date.now();
  const enqueued = await enqueuePushReminders(today);
  const receipts = await checkReceipts(provider);
  // Production sends one Expo batch (up to 100 messages) and requests up to 50 receipts.
  const attempted =
    Date.now() - start < 20000 ? await deliverBatch(provider) : 0;
  return { enqueued, attempted, receipts };
}
