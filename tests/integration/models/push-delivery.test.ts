import crypto from 'crypto';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import { enqueuePushReminders, runPushJob } from 'models/push-delivery';
import {
  PushSessionError,
  preferences,
  registerDevice,
  removeDevice,
} from 'models/push-devices';
import type {
  PushMessage,
  PushProvider,
  SendResult,
} from 'models/push-provider';

const today = new Date('2027-01-05T00:00:00Z');
let user: Awaited<ReturnType<typeof orchestrator.createUser>>;
let auth: Awaited<ReturnType<typeof orchestrator.createSessionForUser>>;
let installation: string;
let sent: PushMessage[];
let result: SendResult;
let receipt: 'ok' | 'pending' | 'error';
let provider: PushProvider;
beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});
beforeEach(async () => {
  await database.query('DELETE FROM groups');
  await database.query('DELETE FROM users');
  user = await orchestrator.createUser();
  auth = await orchestrator.createSessionForUser(user.id);
  installation = crypto.randomUUID();
  sent = [];
  result = { status: 'accepted', id: 'ticket-test' };
  receipt = 'ok';
  provider = {
    async send(message) {
      sent.push(message);
      return result;
    },
    async receipts(ids) {
      return Object.fromEntries(
        ids.map((id) => [
          id,
          receipt === 'error'
            ? { status: 'error', code: 'DeviceNotRegistered' }
            : { status: receipt },
        ]),
      );
    },
  };
});
async function setup() {
  await preferences(user.id, { push_enabled: true });
  await registerDevice(user.id, auth.id, {
    installation_id: installation,
    expo_push_token: 'ExpoPushToken[test-installation]',
    platform: 'ios',
  });
  return orchestrator.createEvent(user.id, {
    event_day: 5,
    event_month: 1,
    title: 'Private event name',
  });
}
async function rows() {
  return (
    await database.query('SELECT * FROM push_deliveries ORDER BY created_at,id')
  ).rows;
}
async function ready() {
  await database.query(
    'UPDATE push_deliveries SET available_at=now(),lease_until=NULL',
  );
}

test('preferences default off and expose a fixed delivery schedule', async () => {
  expect(await preferences(user.id)).toEqual({
    push_enabled: false,
    email_events: true,
    email_marketing: true,
    time_zone: 'America/Sao_Paulo',
    daily_time: '09:00',
  });
  await registerDevice(user.id, auth.id, {
    installation_id: installation,
    expo_push_token: 'ExpoPushToken[test-installation]',
    platform: 'ios',
  });
  await orchestrator.createEvent(user.id, { event_day: 5, event_month: 1 });
  expect(await enqueuePushReminders(today)).toBe(0);
});
test('daily retries and repeated registration preserve logical deduplication', async () => {
  const event = await setup();
  await runPushJob(provider, today);
  await registerDevice(user.id, auth.id, {
    installation_id: installation,
    expo_push_token: 'ExpoPushToken[test-installation]',
    platform: 'ios',
  });
  await runPushJob(provider, today);
  expect(sent).toHaveLength(1);
  expect(await rows()).toHaveLength(1);
  expect(sent[0]).toEqual({
    to: 'ExpoPushToken[test-installation]',
    title: 'Rememberly',
    channelId: 'reminders',
    body: 'You have a date to remember. Open Rememberly to see it.',
    data: { kind: 'event', event_id: event.id },
  });
  expect(JSON.stringify(sent)).not.toContain('Private event name');
  expect(
    (await database.query('SELECT * FROM push_attempts')).rows,
  ).toHaveLength(1);
});
test('registered tokens and installations safely rebind to the authenticated account', async () => {
  await setup();
  await enqueuePushReminders(today);
  const other = await orchestrator.createUser();
  const otherAuth = await orchestrator.createSessionForUser(other.id);
  await registerDevice(other.id, otherAuth.id, {
    installation_id: installation,
    expo_push_token: 'ExpoPushToken[test-installation]',
    platform: 'android',
  });
  expect(await rows()).toHaveLength(0);
  const devices = (await database.query('SELECT * FROM push_devices')).rows;
  expect(devices).toHaveLength(1);
  expect(devices[0]).toMatchObject({
    user_id: other.id,
    session_id: otherAuth.id,
  });
  await registerDevice(other.id, otherAuth.id, {
    installation_id: crypto.randomUUID(),
    expo_push_token: 'ExpoPushToken[test-installation]',
    platform: 'android',
  });
  expect(
    (await database.query('SELECT id FROM push_devices')).rows,
  ).toHaveLength(1);
});
test('revoked registration rolls back without removing another account binding', async () => {
  await setup();
  const other = await orchestrator.createUser();
  const otherAuth = await orchestrator.createSessionForUser(other.id);
  await database.query('UPDATE sessions SET expires_at=now() WHERE id=$1', [
    otherAuth.id,
  ]);
  await expect(
    registerDevice(other.id, otherAuth.id, {
      installation_id: installation,
      expo_push_token: 'ExpoPushToken[test-installation]',
      platform: 'android',
    }),
  ).rejects.toBeInstanceOf(PushSessionError);
  expect(
    (await database.query('SELECT user_id FROM push_devices')).rows[0].user_id,
  ).toBe(user.id);
});
test.each(['expired', 'deleted', 'disabled', 'optout'])(
  '%s devices cannot send previously queued deliveries',
  async (mode) => {
    await setup();
    await enqueuePushReminders(today);
    if (mode === 'expired')
      await database.query('UPDATE sessions SET expires_at=now() WHERE id=$1', [
        auth.id,
      ]);
    if (mode === 'deleted')
      await database.query('DELETE FROM sessions WHERE id=$1', [auth.id]);
    if (mode === 'disabled')
      await database.query('UPDATE push_devices SET disabled_at=now()');
    if (mode === 'optout') await preferences(user.id, { push_enabled: false });
    await runPushJob(provider, today);
    expect(sent).toHaveLength(0);
  },
);
test('device deletion is user scoped and account deletion cascades all push data', async () => {
  await setup();
  await runPushJob(provider, today);
  const other = await orchestrator.createUser();
  await removeDevice(other.id, installation);
  expect(
    (await database.query('SELECT id FROM push_devices')).rows,
  ).toHaveLength(1);
  await database.query('DELETE FROM users WHERE id=$1', [user.id]);
  for (const table of [
    'notification_preferences',
    'push_devices',
    'push_deliveries',
    'push_attempts',
  ])
    expect((await database.query(`SELECT * FROM ${table}`)).rows).toHaveLength(
      0,
    );
});
test('parallel workers never claim one pending delivery twice', async () => {
  await setup();
  await Promise.all([runPushJob(provider, today), runPushJob(provider, today)]);
  expect(sent).toHaveLength(1);
  expect((await rows())[0]).toMatchObject({ attempts: 1, status: 'ticket' });
});
test('unknown send outcomes and expired leases are terminal instead of blind retries', async () => {
  await setup();
  result = { status: 'unknown' };
  await runPushJob(provider, today);
  await ready();
  await runPushJob(provider, today);
  expect(sent).toHaveLength(1);
  expect((await rows())[0]).toMatchObject({
    status: 'failed',
    last_error: 'UnknownOutcome',
  });
  await database.query(
    "UPDATE push_deliveries SET status='sending',lease_until=now()-interval '1 minute'",
  );
  await runPushJob(provider, today);
  expect(sent).toHaveLength(1);
  expect((await rows())[0].status).toBe('failed');
});
test('explicit retryable rejections stop after three durable attempts', async () => {
  await setup();
  result = { status: 'rejected', code: 'MessageRateExceeded', retryable: true };
  for (let i = 0; i < 4; i++) {
    await ready();
    await runPushJob(provider, today);
  }
  expect(sent).toHaveLength(3);
  expect((await rows())[0]).toMatchObject({ status: 'failed', attempts: 3 });
  expect(
    (await database.query('SELECT * FROM push_attempts')).rows,
  ).toHaveLength(3);
});
test('provider receipts confirm acceptance; device rejection disables the registration', async () => {
  await setup();
  await runPushJob(provider, today);
  await ready();
  await runPushJob(provider, today);
  expect((await rows())[0].status).toBe('delivered');
  await database.query("UPDATE push_deliveries SET status='ticket'");
  receipt = 'error';
  await ready();
  await runPushJob(provider, today);
  expect((await rows())[0].status).toBe('failed');
  expect(
    (await database.query('SELECT disabled_at FROM push_devices')).rows[0]
      .disabled_at,
  ).not.toBeNull();
});
test('unknown receipts exhaust a bounded persisted check budget', async () => {
  await setup();
  receipt = 'pending';
  await runPushJob(provider, today);
  for (let i = 0; i < 4; i++) {
    await ready();
    await runPushJob(provider, today);
  }
  expect((await rows())[0]).toMatchObject({
    status: 'failed',
    receipt_checks: 3,
    last_error: 'ReceiptUnknown',
  });
  expect(sent).toHaveLength(1);
});
test('personal advance reminders match configured intervals and shared birthdays deduplicate across groups', async () => {
  await setup();
  await orchestrator.createEvent(user.id, {
    event_day: 8,
    event_month: 1,
    reminder_days_before: 3,
  });
  await orchestrator.createEvent(user.id, {
    event_day: 8,
    event_month: 1,
    reminder_days_before: 7,
  });
  const birthday = await orchestrator.createUser({
    birth_day: 5,
    birth_month: 1,
  });
  // Fixture inserts mirror the real membership schema; ownership itself is not a birthday subscription.
  const groups = await database.query(
    "INSERT INTO groups(name,created_by,invite_code) VALUES('One',$1,'push-one'),('Two',$1,'push-two') RETURNING id",
    [user.id],
  );
  for (const g of groups.rows)
    await database.query(
      "INSERT INTO group_members(group_id,user_id,role) VALUES($1,$2,'owner'),($1,$3,'member')",
      [g.id, user.id, birthday.id],
    );
  expect(await enqueuePushReminders(today)).toBe(3);
  const queue = await rows();
  expect(queue.filter((row) => row.data.kind === 'birthday')).toHaveLength(1);
});
test('each invocation sends at most four queued notifications', async () => {
  await setup();
  for (let i = 0; i < 6; i++)
    await orchestrator.createEvent(user.id, { event_day: 5, event_month: 1 });
  await runPushJob(provider, today);
  expect(sent).toHaveLength(4);
  expect((await rows()).filter((row) => row.status === 'pending')).toHaveLength(
    3,
  );
});

test('commemorative subscriptions produce only the seven-day reminder', async () => {
  await setup();
  await database.query(
    "INSERT INTO commemorative_subscriptions(user_id,date_key) VALUES($1,'christmas')",
    [user.id],
  );
  expect(await enqueuePushReminders(new Date('2027-12-18T00:00:00Z'))).toBe(1);
  expect((await rows())[0].data).toEqual({
    kind: 'commemorative',
    date_key: 'christmas',
  });
  expect(await enqueuePushReminders(new Date('2027-12-19T00:00:00Z'))).toBe(0);
});

test('production batch path claims and maps up to one hundred messages per invocation', async () => {
  await setup();
  await database.query(
    `INSERT INTO events(title,type,event_day,event_month,reminder_days_before,user_id)
    SELECT 'Private batch event','birthday',5,1,0,$1 FROM generate_series(1,100)`,
    [user.id],
  );
  let batches = 0;
  provider.sendBatch = async (messages) => {
    batches++;
    sent.push(...messages);
    return messages.map((_, index) => ({
      status: 'accepted',
      id: `batch-ticket-${index}`,
    }));
  };
  const metrics = await runPushJob(provider, today);
  expect(metrics.attempted).toBe(100);
  expect(batches).toBe(1);
  expect(sent).toHaveLength(100);
  expect((await rows()).filter((row) => row.status === 'pending')).toHaveLength(
    1,
  );
  expect(
    (await database.query('SELECT id FROM push_attempts')).rows,
  ).toHaveLength(100);
});

test('receipts from an earlier registration never disable a refreshed token', async () => {
  await setup();
  await runPushJob(provider, today);
  await registerDevice(user.id, auth.id, {
    installation_id: installation,
    expo_push_token: 'ExpoPushToken[refreshed-installation]',
    platform: 'ios',
  });
  receipt = 'error';
  await ready();
  await runPushJob(provider, today);
  expect(
    (await database.query('SELECT disabled_at FROM push_devices')).rows[0]
      .disabled_at,
  ).toBeNull();
});
test('an abandoned final receipt lease becomes terminal unknown', async () => {
  await setup();
  await runPushJob(provider, today);
  await database.query(
    `UPDATE push_deliveries SET receipt_checks=3,lease_until=now()-interval '1 minute'`,
  );
  await runPushJob(provider, today);
  expect((await rows())[0]).toMatchObject({
    status: 'failed',
    last_error: 'ReceiptUnknown',
  });
});
