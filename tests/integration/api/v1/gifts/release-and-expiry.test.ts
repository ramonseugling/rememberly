import crypto from 'node:crypto';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import { buildGiftReleasedHtml } from 'models/email';
import { expireGiftLists } from 'models/gift-expiry';

const BASE = 'http://localhost:3000/api/v1';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

function call(token: string, method: string, path: string, body?: unknown) {
  return fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function userWithId(
  overrides: Parameters<typeof orchestrator.createUser>[0] = {},
) {
  const user = await orchestrator.createUser(overrides);
  const session = await orchestrator.createSessionForUser(user.id);
  return {
    id: user.id as string,
    token: session.token as string,
    sessionId: session.id as string,
  };
}

async function scenario(
  ownerOverrides: Parameters<typeof orchestrator.createUser>[0] = {},
) {
  const owner = await userWithId(ownerOverrides);
  const alice = await userWithId();
  const group = await orchestrator.createGroup(owner.token, 'Casa');
  await orchestrator.joinGroup(alice.token, group.invite_code);
  const item = await (
    await call(owner.token, 'POST', '/gifts', { title: 'Fone' })
  ).json();
  await call(alice.token, 'PUT', `/gifts/${item.id}/reservation`, {
    status: 'reserved',
  });
  return { owner, alice, item: item as { id: string } };
}

async function enableAlicePush(alice: { id: string; sessionId: string }) {
  await database.query(
    `INSERT INTO notification_preferences(user_id, push_events)
     VALUES($1, true)
     ON CONFLICT (user_id) DO UPDATE SET push_events = true`,
    [alice.id],
  );
  await database.query(
    `INSERT INTO push_devices(installation_id, expo_push_token, user_id, session_id, platform)
     VALUES($1, $2, $3, $4, 'ios')`,
    [
      crypto.randomUUID(),
      `ExponentPushToken[${alice.id}]`,
      alice.id,
      alice.sessionId,
    ],
  );
}

const queued = (userId: string) =>
  database.query(
    `SELECT data FROM push_deliveries WHERE user_id = $1 AND dedup_key LIKE 'gift-released:%'`,
    [userId],
  );

describe('notifying the reserver', () => {
  it('queues a push when the owner confirms an edit or delete', async () => {
    const { owner, alice, item } = await scenario();
    await enableAlicePush(alice);

    const edit = await call(
      owner.token,
      'PATCH',
      `/gifts/${item.id}?confirm=true`,
      { title: 'Fone novo' },
    );

    expect(edit.status).toBe(200);
    const rows = (await queued(alice.id)).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].data).toEqual({ kind: 'gift_released', user_id: owner.id });
  });

  it('does not notify when the owner only gets the confirmation prompt', async () => {
    const { owner, alice, item } = await scenario();
    await enableAlicePush(alice);

    const asked = await call(owner.token, 'DELETE', `/gifts/${item.id}`);

    expect(asked.status).toBe(409);
    expect((await queued(alice.id)).rows).toHaveLength(0);
  });

  it('respects the reserver push preference and never fails the owner request', async () => {
    const { owner, alice, item } = await scenario();
    await enableAlicePush(alice);
    await database.query(
      'UPDATE notification_preferences SET push_events = false, email_events = false WHERE user_id = $1',
      [alice.id],
    );

    const removed = await call(
      owner.token,
      'DELETE',
      `/gifts/${item.id}?confirm=true`,
    );

    expect(removed.status).toBe(204);
    expect((await queued(alice.id)).rows).toHaveLength(0);
  });

  it('renders the e-mail in Portuguese with escaped names', () => {
    const html = buildGiftReleasedHtml(
      'Ana',
      'Beto &amp; Cia',
      'Fone',
      'edited',
    );

    expect(html).toContain('Reserva cancelada');
    expect(html).toContain('Beto &amp; Cia alterou um presente da lista');
    expect(buildGiftReleasedHtml('Ana', 'Beto', 'Fone', 'deleted')).toContain(
      'removeu um presente',
    );
  });
});

describe('post-birthday expiry', () => {
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

  async function listState(ownerId: string) {
    const items = await database.query(
      `SELECT i.title, r.status FROM gift_items i
       JOIN gift_lists l ON l.id = i.list_id
       LEFT JOIN gift_reservations r ON r.item_id = i.id
       WHERE l.user_id = $1 ORDER BY i.title`,
      [ownerId],
    );
    return items.rows as { title: string; status: string | null }[];
  }

  async function withTwoGifts() {
    const { owner, alice, item } = await scenario({
      birth_day: 10,
      birth_month: 5,
    });
    const second = await (
      await call(owner.token, 'POST', '/gifts', { title: 'Livro' })
    ).json();
    await call(alice.token, 'PUT', `/gifts/${second.id}/reservation`, {
      status: 'purchased',
    });
    await call(owner.token, 'POST', '/gifts', { title: 'Tênis' });
    await database.query(
      "UPDATE gift_lists SET created_at = '2026-01-01' WHERE user_id = $1",
      [owner.id],
    );
    return { owner, item };
  }

  it('waits until 7 days after the birthday', async () => {
    const { owner } = await withTwoGifts();

    await expireGiftLists(day('2026-05-16'));

    expect(await listState(owner.id)).toHaveLength(3);
  });

  it('removes purchased gifts and clears reservations, once per birthday', async () => {
    const { owner } = await withTwoGifts();

    await expireGiftLists(day('2026-05-17'));

    expect(await listState(owner.id)).toEqual([
      { title: 'Fone', status: null },
      { title: 'Tênis', status: null },
    ]);
    await call(owner.token, 'POST', '/gifts', { title: 'Novo' });
    const again = await expireGiftLists(day('2026-05-20'));
    expect(again.lists).toBe(0);
    expect(await listState(owner.id)).toHaveLength(3);
  });

  it('catches up when a run was missed and expires again the next year', async () => {
    const { owner } = await withTwoGifts();

    await expireGiftLists(day('2026-07-01'));
    expect(await listState(owner.id)).toHaveLength(2);

    await call(owner.token, 'POST', '/gifts', { title: 'Ano que vem' });
    await expireGiftLists(day('2027-05-18'));
    const row = await database.query(
      'SELECT expired_for::text FROM gift_lists WHERE user_id = $1',
      [owner.id],
    );
    expect(row.rows[0].expired_for).toBe('2027-05-10');
  });

  it('ignores owners without a birthday and lists created after the cutoff', async () => {
    const { owner } = await scenario();
    await database.query(
      'UPDATE users SET birth_day = NULL, birth_month = NULL WHERE id = $1',
      [owner.id],
    );
    const late = await withTwoGifts();
    await database.query(
      "UPDATE gift_lists SET created_at = '2026-05-18' WHERE user_id = $1",
      [late.owner.id],
    );

    await expireGiftLists(day('2026-05-20'));

    expect(await listState(owner.id)).toHaveLength(1);
    expect(await listState(late.owner.id)).toHaveLength(3);
  });

  it('protects the cron route with the secret', async () => {
    const denied = await fetch(`${BASE}/notifications/expire-gifts`);
    expect(denied.status).toBe(401);
  });
});
