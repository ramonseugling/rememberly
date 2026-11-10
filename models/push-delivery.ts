import crypto from 'crypto';
import { COMMEMORATIVE_DATES } from '@/lib/commemorative-dates';
import {
  annualOccurrence,
  commemorativeOccurrence,
  dateOnly,
  referenceDay,
} from '@/lib/mobile-calendar';
import { type DailyPushItem, dailyPushText } from '@/lib/push-text';
import database from 'infra/database';
import { type PushProvider, expoProvider } from 'models/push-provider';

// Announcements follow push_marketing; admin test sends only need a live device.
// Every other kind keeps depending on push_events.
const eligible = (kind: string) => `d.disabled_at IS NULL AND (CASE ${kind}
 WHEN 'announcement' THEN p.push_marketing
 WHEN 'announcement_test' THEN true
 ELSE p.push_events END) AND s.user_id=d.user_id
 AND (s.expires_at IS NULL OR s.expires_at>now())`;
type ItemRef =
  | { k: 'event'; id: string; days: number }
  | { k: 'birthday'; id: string }
  | { k: 'commemorative'; key: string };
const MAX_STORED_ITEMS = 10;
const ADVANCE_DAYS = [1, 3, 7, 15, 30];

function itemRank(item: ItemRef) {
  if (item.k === 'birthday') return 0;
  if (item.k === 'event') return item.days === 0 ? 1 : 2;
  return 3;
}
function itemOrder(a: ItemRef, b: ItemRef) {
  const days = (item: ItemRef) => (item.k === 'event' ? item.days : 0);
  const id = (item: ItemRef) =>
    item.k === 'commemorative' ? item.key : item.id;
  return (
    itemRank(a) - itemRank(b) ||
    days(a) - days(b) ||
    (id(a) < id(b) ? -1 : id(a) > id(b) ? 1 : 0)
  );
}
// One item keeps the legacy tap payload so the app opens the exact destination.
function tapPayload(item: ItemRef | undefined): Record<string, string> {
  if (!item) return { kind: 'daily' };
  if (item.k === 'event') return { kind: 'event', event_id: item.id };
  if (item.k === 'birthday') return { kind: 'birthday', user_id: item.id };
  return { kind: 'commemorative', date_key: item.key };
}

/** Collects every reminder of the day per person and queues ONE daily push per device. */
export async function enqueuePushReminders(today = referenceDay()) {
  const day = dateOnly(today);
  const byUser = new Map<string, ItemRef[]>();
  const add = (userId: string, item: ItemRef) => {
    const list = byUser.get(userId) ?? [];
    list.push(item);
    byUser.set(userId, list);
  };
  const events = await database.query(
    'SELECT id,user_id,event_day,event_month,reminder_days_before FROM events',
  );
  for (const e of events.rows) {
    const days = annualOccurrence(e.event_day, e.event_month, today).days_until;
    if (
      days === 0 ||
      (ADVANCE_DAYS.includes(e.reminder_days_before) &&
        days === e.reminder_days_before)
    )
      add(e.user_id, { k: 'event', id: e.id, days });
  }
  const birthdays = await database.query(
    `SELECT DISTINCT recipient.user_id,b.id AS birthday_id FROM group_members member
    JOIN users b ON b.id=member.user_id JOIN group_members recipient ON recipient.group_id=member.group_id
    AND recipient.user_id<>member.user_id WHERE b.birth_day=$1 AND b.birth_month=$2`,
    [today.getUTCDate(), today.getUTCMonth() + 1],
  );
  for (const b of birthdays.rows)
    add(b.user_id, { k: 'birthday', id: b.birthday_id });
  const keys = COMMEMORATIVE_DATES.filter(
    (def) => commemorativeOccurrence(def, today).days_until === 7,
  ).map((def) => def.key);
  if (keys.length) {
    const subscriptions = await database.query(
      'SELECT user_id,date_key FROM commemorative_subscriptions WHERE date_key=ANY($1::text[])',
      [keys],
    );
    for (const s of subscriptions.rows)
      add(s.user_id, { k: 'commemorative', key: s.date_key });
  }
  let enqueued = 0;
  for (const [userId, list] of byUser) {
    list.sort(itemOrder);
    const data = {
      ...tapPayload(list.length === 1 ? list[0] : undefined),
      total: list.length,
      items: list.slice(0, MAX_STORED_ITEMS),
    };
    enqueued += await enqueuePush(userId, `daily:${day}`, data);
  }
  return enqueued;
}

export async function enqueuePush(
  userId: string,
  key: string,
  data: Record<string, unknown>,
) {
  const result = await database.query(
    `INSERT INTO push_deliveries(device_id,user_id,session_id,dedup_key,data)
      SELECT d.id,d.user_id,d.session_id,$2,$3::jsonb FROM push_devices d
      JOIN notification_preferences p ON p.user_id=d.user_id JOIN sessions s ON s.id=d.session_id
      WHERE d.user_id=$1 AND ${eligible("($3::jsonb->>'kind')")} ON CONFLICT(device_id,dedup_key) DO NOTHING`,
    [userId, key, JSON.stringify(data)],
  );
  return result.rowCount ?? 0;
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
      AND d.user_id=q.user_id AND ${eligible("q.data->>'kind'")})`);
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
function staticBody(data: { kind?: string }) {
  if (data.kind === 'gift_released')
    return 'Um presente que você reservou mudou. Abra o Rememberly para ver.';
  return 'You have a date to remember. Open Rememberly to see it.';
}

type DeliveryRow = { id: string; data: Record<string, unknown> };
const isDaily = (row: DeliveryRow) => Array.isArray(row.data.items);

/** Resolves the stored item refs against the current database so names are never stale. */
async function dailyContents(rows: DeliveryRow[]) {
  const stored = (row: DeliveryRow) => row.data.items as ItemRef[];
  const daily = rows.filter(isDaily);
  const pick = (k: ItemRef['k']) => [
    ...new Set(
      daily.flatMap((row) =>
        stored(row)
          .filter((item) => item.k === k)
          .map((item) => (item as { id: string }).id),
      ),
    ),
  ];
  const eventIds = pick('event');
  const userIds = pick('birthday');
  const events = new Map<string, { title: string; type: string }>();
  const people = new Map<string, string>();
  if (eventIds.length)
    for (const e of (
      await database.query(
        'SELECT id,title,type FROM events WHERE id=ANY($1::uuid[])',
        [eventIds],
      )
    ).rows)
      events.set(e.id, e);
  if (userIds.length)
    for (const u of (
      await database.query(
        'SELECT id,name FROM users WHERE id=ANY($1::uuid[])',
        [userIds],
      )
    ).rows)
      people.set(u.id, u.name);
  const contents = new Map<
    string,
    { body: string; data: Record<string, string> }
  >();
  for (const row of daily) {
    const refs: ItemRef[] = [];
    const items: DailyPushItem[] = [];
    for (const item of stored(row)) {
      if (item.k === 'event') {
        const event = events.get(item.id);
        if (event) {
          refs.push(item);
          items.push({
            kind: 'event',
            title: event.title,
            type: event.type,
            days: item.days,
          });
        }
      } else if (item.k === 'birthday') {
        const name = people.get(item.id);
        if (name?.trim()) {
          refs.push(item);
          items.push({ kind: 'group_birthday', name });
        }
      } else {
        const def = COMMEMORATIVE_DATES.find((d) => d.key === item.key);
        if (def) {
          refs.push(item);
          items.push({ kind: 'commemorative', label: def.label });
        }
      }
    }
    if (!items.length) continue;
    const dropped = stored(row).length - items.length;
    const total = Math.max(Number(row.data.total ?? 0) - dropped, items.length);
    contents.set(row.id, {
      body: dailyPushText(items, total),
      data: tapPayload(total === 1 ? refs[0] : undefined),
    });
  }
  return contents;
}

function announcementContent(row: {
  data: { kind?: string };
  announcement_title: string | null;
  announcement_body: string | null;
}) {
  if (
    (row.data.kind !== 'announcement' &&
      row.data.kind !== 'announcement_test') ||
    !row.announcement_title ||
    !row.announcement_body
  )
    return null;
  const prefix = row.data.kind === 'announcement_test' ? '[Teste] ' : '';
  return {
    title: `${prefix}${row.announcement_title}`,
    body: row.announcement_body,
  };
}

async function deliverBatch(provider: PushProvider) {
  const claimed = await claim(provider.sendBatch ? 100 : 4);
  if (!claimed.length) return 0;
  // Recheck session binding and opt-in immediately before the external request.
  const current = await database.query(
    `SELECT q.*,d.expo_push_token,
    c.push_title AS announcement_title,c.push_body AS announcement_body FROM push_deliveries q
    JOIN push_devices d ON d.id=q.device_id AND d.user_id=q.user_id AND d.session_id=q.session_id
    JOIN notification_preferences p ON p.user_id=d.user_id JOIN sessions s ON s.id=d.session_id
    LEFT JOIN communications c ON q.data->>'kind' IN ('announcement','announcement_test')
      AND c.id::text=q.data->>'communication_id'
    WHERE q.id=ANY($1::uuid[]) AND q.status='sending' AND ${eligible("q.data->>'kind'")}`,
    [claimed.map((row) => row.id)],
  );
  // An announcement whose composed content is gone must never fall back to generic copy.
  const daily = await dailyContents(current.rows);
  const sendable = current.rows.filter((row) =>
    isDaily(row)
      ? daily.has(row.id)
      : (row.data.kind !== 'announcement' &&
          row.data.kind !== 'announcement_test') ||
        announcementContent(row),
  );
  const ids = new Set(sendable.map((row) => row.id));
  for (const row of claimed)
    if (!ids.has(row.id)) await finish(row, 'cancelled', 'Ineligible');
  const messages = sendable.map((row) => {
    const announcement = announcementContent(row);
    const content = daily.get(row.id);
    return {
      to: row.expo_push_token,
      title: announcement?.title ?? 'Rememberly',
      channelId: 'reminders' as const,
      body: announcement?.body ?? content?.body ?? staticBody(row.data),
      data: content?.data ?? row.data,
    };
  });
  let results: Awaited<ReturnType<PushProvider['send']>>[];
  try {
    results = provider.sendBatch
      ? await provider.sendBatch(messages)
      : await Promise.all(messages.map((message) => provider.send(message)));
  } catch {
    results = messages.map(() => ({ status: 'unknown' }));
  }
  for (let index = 0; index < sendable.length; index++) {
    const row = sendable[index];
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
  return sendable.length;
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
