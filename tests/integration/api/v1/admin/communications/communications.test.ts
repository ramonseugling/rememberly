import crypto from 'crypto';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import { preferences, registerDevice } from 'models/push-devices';

const base = 'http://localhost:3000/api/v1/admin/communications';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

beforeEach(async () => {
  await database.query('DELETE FROM communications');
  await database.query('DELETE FROM users');
});

function call(
  path: string,
  token: string | null,
  method = 'GET',
  body?: unknown,
) {
  return fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

const pushOnly = {
  title: 'Novidade em push',
  push_title: 'Título',
  push_body: 'Texto',
  send_email: false,
  send_push: true,
};

async function pushUser() {
  const { user, session } = await orchestrator.createUserAndSession();
  await preferences(user.id, { push_marketing: true });
  await registerDevice(user.id, session.id, {
    installation_id: crypto.randomUUID(),
    expo_push_token: `ExpoPushToken[${crypto.randomUUID()}]`,
    platform: 'ios',
  });
  return user;
}

describe('authorization', () => {
  test.each([
    ['', 'GET'],
    ['', 'POST'],
    ['/preview', 'POST'],
    [`/${UNKNOWN_ID}`, 'GET'],
    [`/${UNKNOWN_ID}`, 'PATCH'],
    [`/${UNKNOWN_ID}/recipients`, 'GET'],
    [`/${UNKNOWN_ID}/send-test`, 'POST'],
    [`/${UNKNOWN_ID}/send`, 'POST'],
  ])('%s %s rejects anonymous and non-admin users', async (path, method) => {
    const { session } = await orchestrator.createUserAndSession();
    const body = method === 'GET' ? undefined : {};

    expect((await call(path, null, method, body)).status).toBe(401);
    expect((await call(path, session.token, method, body)).status).toBe(401);
  });
});

describe('create, update and list', () => {
  test('creates a draft, validates input in Portuguese and lists it', async () => {
    const { session } = await orchestrator.createAdminUserAndSession();

    const invalid = await call('', session.token, 'POST', { title: 'x' });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).message).toBe(
      'O título deve ter pelo menos 2 caracteres.',
    );

    const tooLong = await call('', session.token, 'POST', {
      title: 'Ok',
      push_title: 'x'.repeat(200),
    });
    expect(tooLong.status).toBe(400);

    const created = await call('', session.token, 'POST', {
      title: 'Primeiro',
      email_subject: 'Assunto',
      email_body: 'Corpo',
    });
    const body = await created.json();
    expect(created.status).toBe(201);
    expect(body).toMatchObject({
      title: 'Primeiro',
      status: 'draft',
      send_email: true,
      send_push: false,
    });

    const patched = await call(`/${body.id}`, session.token, 'PATCH', {
      send_push: true,
    });
    expect(patched.status).toBe(200);
    expect((await patched.json()).send_push).toBe(true);
    expect((await call(`/${body.id}`, session.token, 'PATCH', {})).status).toBe(
      400,
    );
    expect((await call('/not-a-uuid', session.token)).status).toBe(400);

    const list = await (await call('', session.token)).json();
    expect(list.communications).toHaveLength(1);
  });

  test('returns 404 for an unknown communication', async () => {
    const { session } = await orchestrator.createAdminUserAndSession();

    expect((await call(`/${UNKNOWN_ID}`, session.token)).status).toBe(404);
  });
});

describe('recipients, test and send', () => {
  test('counts, test send and send with confirmation, dedup and no double send', async () => {
    const { user: admin, session } =
      await orchestrator.createAdminUserAndSession();
    await pushUser();
    await pushUser();
    const created = await (
      await call('', session.token, 'POST', pushOnly)
    ).json();

    const counts = await (
      await call(`/${created.id}/recipients`, session.token)
    ).json();
    expect(counts).toEqual({ email: 0, push: 2 });

    const adminAuth = await orchestrator.createSessionForUser(admin.id);
    await preferences(admin.id, { email_events: true });
    await registerDevice(admin.id, adminAuth.id, {
      installation_id: crypto.randomUUID(),
      expo_push_token: 'ExpoPushToken[admin-api]',
      platform: 'ios',
    });
    const test = await call(`/${created.id}/send-test`, session.token, 'POST');
    expect(test.status).toBe(200);
    expect(await test.json()).toEqual({ email: null, push_devices: 1 });
    expect(
      (await database.query('SELECT 1 FROM communication_deliveries')).rowCount,
    ).toBe(0);

    const missing = await call(
      `/${created.id}/send`,
      session.token,
      'POST',
      {},
    );
    expect(missing.status).toBe(400);

    const stale = await call(`/${created.id}/send`, session.token, 'POST', {
      confirm_recipients: { email: 0, push: 5 },
    });
    expect(stale.status).toBe(409);

    const sent = await call(`/${created.id}/send`, session.token, 'POST', {
      confirm_recipients: { email: 0, push: 2 },
    });
    expect(sent.status).toBe(200);
    expect(await sent.json()).toMatchObject({
      status: 'sent',
      push_users: 2,
      push_devices: 2,
    });
    expect(
      (
        await database.query(
          `SELECT 1 FROM push_deliveries WHERE data->>'kind'='announcement'`,
        )
      ).rowCount,
    ).toBe(2);

    const again = await call(`/${created.id}/send`, session.token, 'POST', {
      confirm_recipients: { email: 0, push: 0 },
    });
    expect(again.status).toBe(409);
    expect((await again.json()).reason).toBe('already_sent');
  });

  test('refuses to send when the enabled channel content is missing', async () => {
    const { session } = await orchestrator.createAdminUserAndSession();
    const created = await (
      await call('', session.token, 'POST', {
        title: 'Vazio',
        send_email: true,
      })
    ).json();

    const response = await call(`/${created.id}/send`, session.token, 'POST', {
      confirm_recipients: { email: 1, push: 0 },
    });
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe(
      'Preencha o assunto e o texto do e-mail.',
    );
  });

  test('preview renders escaped HTML', async () => {
    const { session } = await orchestrator.createAdminUserAndSession();

    const response = await call('/preview', session.token, 'POST', {
      title: 'Oi',
      email_body: '<script>x</script>',
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.html).toContain('&lt;script&gt;');
    expect(body.html).not.toContain('<script>');
  });
});
