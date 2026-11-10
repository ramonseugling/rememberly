import crypto from 'crypto';
import orchestrator from 'tests/orchestrator';
import { renderCommunicationBody } from '@/lib/communication-markdown';
import database from 'infra/database';
import communication, { type SendDeps } from 'models/communication';
import { buildCommunicationHtml } from 'models/email';
import { setEmailMarketing } from 'models/notification-preferences';
import { enqueuePush, runPushJob } from 'models/push-delivery';
import { preferences, registerDevice } from 'models/push-devices';
import type { PushMessage, PushProvider } from 'models/push-provider';

let admin: Awaited<ReturnType<typeof orchestrator.createUser>>;
let sentEmails: string[];
let failFor: string | null;
let deps: SendDeps;

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

beforeEach(async () => {
  await database.query('DELETE FROM communications');
  await database.query('DELETE FROM users');
  admin = await orchestrator.createUser({ is_admin: true });
  sentEmails = [];
  failFor = null;
  deps = {
    async sendEmail(input) {
      if (input.to === failFor) throw new Error('boom');
      sentEmails.push(input.to);
    },
  };
});

function draft(
  overrides: Partial<Parameters<typeof communication.create>[0]> = {},
) {
  return communication.create(
    {
      title: 'Novidade',
      email_subject: 'Assunto',
      email_body: 'Olá **mundo**',
      push_title: 'Título',
      push_body: 'Texto do push',
      send_email: true,
      send_push: false,
      ...overrides,
    },
    admin.id,
  );
}

async function pushUser(options: { marketing: boolean; events?: boolean }) {
  const user = await orchestrator.createUser();
  const auth = await orchestrator.createSessionForUser(user.id);
  await preferences(user.id, {
    push_marketing: options.marketing,
    push_enabled: options.events ?? false,
  });
  await registerDevice(user.id, auth.id, {
    installation_id: crypto.randomUUID(),
    expo_push_token: `ExpoPushToken[${crypto.randomUUID()}]`,
    platform: 'ios',
  });
  return { user, auth };
}

describe('recipient counts', () => {
  test('email counts only users opted in to marketing e-mail', async () => {
    await orchestrator.createUser({ marketing_consent: true });
    const out = await orchestrator.createUser({ marketing_consent: true });
    await setEmailMarketing(out.id, false);
    await orchestrator.createUser({ marketing_consent: false });
    const created = await draft();

    // admin + the opted-in user
    expect(await communication.countRecipients(created.id)).toEqual({
      email: 2,
      push: 0,
    });
  });

  test('push counts users with push_marketing and a valid device, once per user', async () => {
    const withMarketing = await pushUser({ marketing: true });
    await pushUser({ marketing: false, events: true });
    await registerDevice(withMarketing.user.id, withMarketing.auth.id, {
      installation_id: crypto.randomUUID(),
      expo_push_token: 'ExpoPushToken[second-device]',
      platform: 'android',
    });
    const expired = await pushUser({ marketing: true });
    await database.query('UPDATE sessions SET expires_at=now() WHERE id=$1', [
      expired.auth.id,
    ]);
    const created = await draft({ send_email: false, send_push: true });

    expect((await communication.countRecipients(created.id)).push).toBe(1);
  });
});

describe('send', () => {
  test('requires the confirmed counts and refuses a stale confirmation', async () => {
    await orchestrator.createUser();
    const created = await draft();

    await expect(
      communication.send(created.id, { email: 99, push: 0 }, deps),
    ).rejects.toMatchObject({ reason: 'recipients_changed' });
    expect(sentEmails).toHaveLength(0);
    expect((await communication.findById(created.id)).status).toBe('draft');
  });

  test('sends once per user, records counts and refuses a second send', async () => {
    await orchestrator.createUser();
    const optedOut = await orchestrator.createUser();
    await setEmailMarketing(optedOut.id, false);
    const created = await draft();

    const sent = await communication.send(
      created.id,
      { email: 2, push: 0 },
      deps,
    );

    expect(sent.status).toBe('sent');
    expect(sent.email_sent).toBe(2);
    expect(sent.email_failed).toBe(0);
    expect(sent.sent_at).not.toBeNull();
    expect(sentEmails).not.toContain(optedOut.email);
    expect(new Set(sentEmails).size).toBe(2);

    await expect(
      communication.send(created.id, { email: 0, push: 0 }, deps),
    ).rejects.toMatchObject({ reason: 'already_sent' });
    expect(sentEmails).toHaveLength(2);
  });

  test('failed e-mails are counted and not recorded as delivered', async () => {
    const other = await orchestrator.createUser();
    failFor = other.email;
    const created = await draft();

    const sent = await communication.send(
      created.id,
      { email: 2, push: 0 },
      deps,
    );

    expect(sent.email_sent).toBe(1);
    expect(sent.email_failed).toBe(1);
    const delivered = await database.query(
      'SELECT user_id FROM communication_deliveries WHERE communication_id=$1',
      [created.id],
    );
    expect(delivered.rows.map((row) => row.user_id)).toEqual([admin.id]);
  });

  test('a sent communication can no longer be edited', async () => {
    const created = await draft();
    await communication.send(created.id, { email: 1, push: 0 }, deps);

    await expect(
      communication.update(created.id, { title: 'Outro' }),
    ).rejects.toMatchObject({ reason: 'already_sent' });
  });

  test('rejects incomplete content for an enabled channel', async () => {
    const created = await draft({ send_push: true, push_body: null });

    await expect(
      communication.send(created.id, { email: 1, push: 0 }, deps),
    ).rejects.toMatchObject({ name: 'ValidationError' });
    await expect(
      communication.sendTest(created.id, admin, deps),
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });
});

describe('test send', () => {
  test('goes only to the admin and is not recorded as a delivery', async () => {
    await orchestrator.createUser();
    const created = await draft();

    const result = await communication.sendTest(created.id, admin, deps);

    expect(result.email).toBe('sent');
    expect(sentEmails).toEqual([admin.email]);
    const deliveries = await database.query(
      'SELECT 1 FROM communication_deliveries',
    );
    expect(deliveries.rowCount).toBe(0);
    expect((await communication.findById(created.id)).status).toBe('draft');
    expect((await communication.countRecipients(created.id)).email).toBe(2);
  });

  test('push test reaches the admin devices even without push_marketing', async () => {
    const auth = await orchestrator.createSessionForUser(admin.id);
    await preferences(admin.id, { email_events: true });
    await registerDevice(admin.id, auth.id, {
      installation_id: crypto.randomUUID(),
      expo_push_token: 'ExpoPushToken[admin-device]',
      platform: 'ios',
    });
    await pushUser({ marketing: true });
    const created = await draft({ send_email: false, send_push: true });

    const result = await communication.sendTest(created.id, admin, deps);

    expect(result.push_devices).toBe(1);
    const queued = await database.query(
      'SELECT user_id, data FROM push_deliveries',
    );
    expect(queued.rows).toHaveLength(1);
    expect(queued.rows[0].user_id).toBe(admin.id);
    expect(queued.rows[0].data.kind).toBe('announcement_test');
  });
});

describe('push delivery of announcements', () => {
  test('enqueues for push_marketing users and delivers the composed copy', async () => {
    const wanted = await pushUser({ marketing: true });
    await pushUser({ marketing: false, events: true });
    const created = await draft({ send_email: false, send_push: true });

    const sent = await communication.send(
      created.id,
      { email: 0, push: 1 },
      deps,
    );

    expect(sent.push_users).toBe(1);
    expect(sent.push_devices).toBe(1);
    const queued = await database.query(
      'SELECT user_id, data FROM push_deliveries',
    );
    expect(queued.rows).toHaveLength(1);
    expect(queued.rows[0].user_id).toBe(wanted.user.id);
    expect(queued.rows[0].data).toEqual({
      kind: 'announcement',
      communication_id: created.id,
    });

    const messages: PushMessage[] = [];
    const provider: PushProvider = {
      async send(message) {
        messages.push(message);
        return { status: 'accepted', id: 'ticket' };
      },
      async receipts() {
        return {};
      },
    };
    await database.query('UPDATE push_deliveries SET available_at=now()');
    await runPushJob(provider);

    expect(messages).toHaveLength(1);
    expect(messages[0].title).toBe('Título');
    expect(messages[0].body).toBe('Texto do push');
    expect(messages[0].data).toEqual({
      kind: 'announcement',
      communication_id: created.id,
    });
  });

  test('turning push_marketing off before delivery cancels the announcement', async () => {
    const wanted = await pushUser({ marketing: true, events: true });
    const created = await draft({ send_email: false, send_push: true });
    await communication.send(created.id, { email: 0, push: 1 }, deps);

    await preferences(wanted.user.id, { push_marketing: false });

    const rows = await database.query('SELECT status FROM push_deliveries');
    expect(rows.rows.map((row) => row.status)).toEqual(['cancelled']);
  });

  test('turning event push off leaves a pending announcement alone', async () => {
    const wanted = await pushUser({ marketing: true, events: true });
    const created = await draft({ send_email: false, send_push: true });
    await communication.send(created.id, { email: 0, push: 1 }, deps);

    await preferences(wanted.user.id, { push_enabled: false });

    const rows = await database.query('SELECT status FROM push_deliveries');
    expect(rows.rows.map((row) => row.status)).toEqual(['pending']);
  });

  test('event push preference does not gate announcements and vice versa', async () => {
    const onlyMarketing = await pushUser({ marketing: true, events: false });
    const onlyEvents = await pushUser({ marketing: false, events: true });
    const created = await draft({ send_email: false, send_push: true });
    await communication.send(created.id, { email: 0, push: 1 }, deps);

    const queued = await database.query('SELECT user_id FROM push_deliveries');
    expect(queued.rows.map((row) => row.user_id)).toEqual([
      onlyMarketing.user.id,
    ]);

    expect(
      await enqueuePush(onlyMarketing.user.id, 'event:x', { kind: 'event' }),
    ).toBe(0);
    expect(
      await enqueuePush(onlyEvents.user.id, 'event:x', { kind: 'event' }),
    ).toBe(1);
  });
});

describe('e-mail rendering', () => {
  test('escapes HTML and only allows http(s) links', () => {
    const html = renderCommunicationBody(
      '<script>alert(1)</script> **bold**\n\n[ok](https://example.com?a=1&b=2) [bad](javascript:alert(1))',
    );

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('href="https://example.com?a=1&amp;b=2"');
    expect(html).not.toContain('href="javascript');
    expect(html.match(/<p /g)).toHaveLength(2);
  });

  test('wraps the body in the brand layout with the unsubscribe link', () => {
    const html = buildCommunicationHtml(
      '<b>Ana</b>',
      { title: 'Título <i>x</i>', body: 'Texto' },
      'https://example.com/unsub',
    );

    expect(html).toContain('Rememberly');
    expect(html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
    expect(html).toContain('Título &lt;i&gt;x&lt;/i&gt;');
    expect(html).toContain('href="https://example.com/unsub"');
  });
});
