import crypto from 'node:crypto';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';

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

async function userWithId() {
  const user = await orchestrator.createUser();
  const session = await orchestrator.createSessionForUser(user.id);
  return { id: user.id as string, token: session.token as string };
}

async function scenario() {
  const owner = await userWithId();
  const alice = await userWithId();
  const bob = await userWithId();
  const group = await orchestrator.createGroup(owner.token, 'Casa');
  await orchestrator.joinGroup(alice.token, group.invite_code);
  await orchestrator.joinGroup(bob.token, group.invite_code);
  const item = await (
    await call(owner.token, 'POST', '/gifts', {
      title: 'Fone',
      link: 'https://example.com/item',
    })
  ).json();
  return { owner, alice, bob, group, item: item as { id: string } };
}

const reserve = (token: string, id: string, status = 'reserved') =>
  call(token, 'PUT', `/gifts/${id}/reservation`, { status });

async function memberView(token: string, ownerId: string) {
  return (await call(token, 'GET', `/users/${ownerId}/gifts`)).json();
}

describe('secret gift reservations', () => {
  it('lets one member reserve, others see it taken, and the owner sees nothing', async () => {
    const { owner, alice, bob, item } = await scenario();

    expect((await reserve(alice.token, item.id)).status).toBe(200);

    expect((await memberView(alice.token, owner.id)).items[0]).toMatchObject({
      availability: 'reserved',
      reserved_by_me: true,
    });
    expect((await memberView(bob.token, owner.id)).items[0]).toMatchObject({
      availability: 'reserved',
      reserved_by_me: false,
    });
    const own = await memberView(owner.token, owner.id);
    expect(Object.keys(own.items[0]).sort()).toEqual([
      'created_at',
      'description',
      'id',
      'link',
      'photo_url',
      'title',
      'updated_at',
    ]);
    const ownList = await (await call(owner.token, 'GET', '/gifts')).json();
    expect(JSON.stringify(ownList)).not.toMatch(/availability|reserved/);
  });

  it('refuses a second reserver with 409, and lets the holder update or cancel', async () => {
    const { owner, alice, bob, item } = await scenario();
    await reserve(alice.token, item.id);

    const taken = await reserve(bob.token, item.id);
    expect(taken.status).toBe(409);
    expect((await taken.json()).reason).toBe('taken');

    expect((await reserve(alice.token, item.id, 'purchased')).status).toBe(200);
    expect((await memberView(bob.token, owner.id)).items[0].availability).toBe(
      'purchased',
    );
    const path = `/gifts/${item.id}/reservation`;
    expect((await call(bob.token, 'DELETE', path)).status).toBe(404);
    expect((await call(alice.token, 'DELETE', path)).status).toBe(204);
    expect((await reserve(bob.token, item.id)).status).toBe(200);
  });

  it('lets only one of two concurrent reservations win', async () => {
    const { alice, bob, item } = await scenario();

    const results = await Promise.all(
      [alice, bob].map((user) => reserve(user.token, item.id)),
    );

    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });

  it('rejects the owner, outsiders, bad ids and bad payloads', async () => {
    const { owner, alice, item } = await scenario();
    const outsider = await userWithId();

    expect((await reserve(owner.token, item.id)).status).toBe(404);
    expect((await reserve(outsider.token, item.id)).status).toBe(404);
    expect((await reserve(alice.token, 'abc')).status).toBe(404);
    expect((await reserve(alice.token, crypto.randomUUID())).status).toBe(404);
    expect((await reserve(alice.token, item.id, 'xyz')).status).toBe(400);
    expect(
      (await call(alice.token, 'PUT', `/gifts/${item.id}/reservation`, {}))
        .status,
    ).toBe(400);
  });

  it('drops a reservation when the reserver loses access, but keeps purchases', async () => {
    const { owner, alice, bob, group, item } = await scenario();
    const second = await (
      await call(owner.token, 'POST', '/gifts', {
        title: 'Livro',
        link: 'https://example.com/item',
      })
    ).json();
    await reserve(alice.token, item.id);
    await reserve(alice.token, second.id, 'purchased');

    await database.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [group.id, alice.id],
    );

    const items = (await memberView(bob.token, owner.id)).items as {
      id: string;
      availability: string;
    }[];
    const byId = Object.fromEntries(items.map((i) => [i.id, i.availability]));
    expect(byId[item.id]).toBe('available');
    expect(byId[second.id]).toBe('purchased');
  });

  it('removes reservations when the reserver account is deleted', async () => {
    const { alice, item } = await scenario();
    await reserve(alice.token, item.id);

    await database.query('DELETE FROM users WHERE id = $1', [alice.id]);

    const rows = await database.query(
      'SELECT 1 FROM gift_reservations WHERE item_id = $1',
      [item.id],
    );
    expect(rows.rows).toHaveLength(0);
  });
});

describe('owner changes on reserved or purchased gifts', () => {
  it('asks for confirmation on edit, then releases the reservation', async () => {
    const { owner, alice, item } = await scenario();
    await reserve(alice.token, item.id);

    const asked = await call(owner.token, 'PATCH', `/gifts/${item.id}`, {
      title: 'Fone novo',
    });
    expect(asked.status).toBe(409);
    expect((await asked.json()).reason).toBe('reserved');

    const confirmed = await call(
      owner.token,
      'PATCH',
      `/gifts/${item.id}?confirm=true`,
      { title: 'Fone novo' },
    );
    expect(confirmed.status).toBe(200);
    expect((await memberView(alice.token, owner.id)).items[0]).toMatchObject({
      title: 'Fone novo',
      availability: 'available',
      reserved_by_me: false,
    });
  });

  it('asks for confirmation on delete, then removes the gift', async () => {
    const { owner, alice, item } = await scenario();
    await reserve(alice.token, item.id);

    const asked = await call(owner.token, 'DELETE', `/gifts/${item.id}`);
    const confirmed = await call(
      owner.token,
      'DELETE',
      `/gifts/${item.id}?confirm=true`,
    );

    expect(asked.status).toBe(409);
    expect(confirmed.status).toBe(204);
    expect((await memberView(alice.token, owner.id)).items).toEqual([]);
  });

  it('blocks edits and deletes of purchased gifts even when confirmed', async () => {
    const { owner, alice, item } = await scenario();
    await reserve(alice.token, item.id, 'purchased');

    const edit = await call(
      owner.token,
      'PATCH',
      `/gifts/${item.id}?confirm=true`,
      { title: 'x' },
    );
    const remove = await call(
      owner.token,
      'DELETE',
      `/gifts/${item.id}?confirm=true`,
    );

    expect(edit.status).toBe(409);
    expect((await edit.json()).reason).toBe('purchased');
    expect(remove.status).toBe(409);
  });

  it('does not leak who reserved: the 409 carries no user data', async () => {
    const { owner, alice, item } = await scenario();
    await reserve(alice.token, item.id);

    const body = await (
      await call(owner.token, 'DELETE', `/gifts/${item.id}`)
    ).json();

    expect(JSON.stringify(body)).not.toContain(alice.id);
  });
});
