import orchestrator from 'tests/orchestrator';

const BASE = 'http://localhost:3000/api/v1';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

function call(
  token: string | null,
  method: string,
  path: string,
  body?: unknown,
) {
  return fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

async function ownerWithList() {
  const owner = await userWithId();
  const item = await (
    await call(owner.token, 'POST', '/gifts', {
      title: 'Fone',
      link: 'https://example.com/item',
    })
  ).json();
  const { token: code } = await (
    await call(owner.token, 'GET', '/gifts/share-link')
  ).json();
  return { owner, item: item as { id: string }, code: code as string };
}

describe('gift list public link', () => {
  it('gives each list a stable random code and requires login to read it', async () => {
    const owner = await userWithId();

    const anonymous = await call(null, 'GET', '/gifts/share-link');
    expect(anonymous.status).toBe(401);

    const first = await (
      await call(owner.token, 'GET', '/gifts/share-link')
    ).json();
    const second = await (
      await call(owner.token, 'GET', '/gifts/share-link')
    ).json();
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(second.token).toBe(first.token);
    expect(first.token).not.toContain(owner.id);
  });

  it('lets anyone with the link read the list without logging in', async () => {
    const { code, owner } = await ownerWithList();

    const response = await call(null, 'GET', `/public/gift-lists/${code}`);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.owner.id).toBe(owner.id);
    expect(data.owner.email).toBeUndefined();
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      title: 'Fone',
      availability: 'available',
      reserved_by_me: false,
    });
    expect(data.viewer_is_owner).toBe(false);
  });

  it('returns 404 for an unknown or malformed code', async () => {
    expect(
      (await call(null, 'GET', '/public/gift-lists/AAAAAAAAAAAAAAAAAAAAAA'))
        .status,
    ).toBe(404);
    expect((await call(null, 'GET', '/public/gift-lists/abc')).status).toBe(
      404,
    );
  });

  it('lets a signed-in stranger reserve through the link, and only one person per gift', async () => {
    const { code, item } = await ownerWithList();
    const alice = await userWithId();
    const bob = await userWithId();

    const withoutCode = await call(
      alice.token,
      'PUT',
      `/gifts/${item.id}/reservation`,
      { status: 'reserved' },
    );
    expect(withoutCode.status).toBe(404);

    const anonymous = await call(null, 'PUT', `/gifts/${item.id}/reservation`, {
      status: 'reserved',
      token: code,
    });
    expect(anonymous.status).toBe(401);

    const reserved = await call(
      alice.token,
      'PUT',
      `/gifts/${item.id}/reservation`,
      { status: 'reserved', token: code },
    );
    expect(reserved.status).toBe(200);

    const taken = await call(
      bob.token,
      'PUT',
      `/gifts/${item.id}/reservation`,
      { status: 'reserved', token: code },
    );
    expect(taken.status).toBe(409);

    const publicView = await (
      await call(null, 'GET', `/public/gift-lists/${code}`)
    ).json();
    expect(publicView.items[0].availability).toBe('reserved');
    expect(publicView.items[0].reserved_by_me).toBe(false);

    const aliceView = await (
      await call(alice.token, 'GET', `/public/gift-lists/${code}`)
    ).json();
    expect(aliceView.items[0].reserved_by_me).toBe(true);
  });

  it('keeps the owner from seeing who reserved', async () => {
    const { code, item, owner } = await ownerWithList();
    const alice = await userWithId();
    await call(alice.token, 'PUT', `/gifts/${item.id}/reservation`, {
      status: 'reserved',
      token: code,
    });

    const ownerView = await (
      await call(owner.token, 'GET', `/public/gift-lists/${code}`)
    ).json();
    expect(ownerView.viewer_is_owner).toBe(true);
    expect(ownerView.items[0].availability).toBeUndefined();
    expect(ownerView.items[0].reserved_by_me).toBeUndefined();
  });

  it('opens the signed-in list endpoint with the code for someone outside the groups', async () => {
    const { code, owner } = await ownerWithList();
    const stranger = await userWithId();

    const blocked = await call(
      stranger.token,
      'GET',
      `/users/${owner.id}/gifts`,
    );
    expect(blocked.status).toBe(404);

    const allowed = await call(
      stranger.token,
      'GET',
      `/users/${owner.id}/gifts?token=${code}`,
    );
    expect(allowed.status).toBe(200);
  });

  it('stops working after the owner renews the code', async () => {
    const { code, owner } = await ownerWithList();

    const renewed = await (
      await call(owner.token, 'POST', '/gifts/share-link')
    ).json();
    expect(renewed.token).not.toBe(code);

    expect((await call(null, 'GET', `/public/gift-lists/${code}`)).status).toBe(
      404,
    );
    expect(
      (await call(null, 'GET', `/public/gift-lists/${renewed.token}`)).status,
    ).toBe(200);
  });
});
