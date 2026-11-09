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

async function addItem(token: string, title: string) {
  await call(token, 'POST', '/gifts', { title });
}

describe('who can see a gift list', () => {
  async function scenario() {
    const owner = await userWithId();
    const viewer = await userWithId();
    const group = await orchestrator.createGroup(owner.token, 'Casa');
    await orchestrator.joinGroup(viewer.token, group.invite_code);
    await addItem(owner.token, 'Fone de ouvido');
    return { owner, viewer, group };
  }

  it('shows the list to anyone who shares a group with the owner, without any sharing step', async () => {
    const { owner, viewer } = await scenario();

    const response = await call(
      viewer.token,
      'GET',
      `/users/${owner.id}/gifts`,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.owner.id).toBe(owner.id);
    expect(data.items.map((item: { title: string }) => item.title)).toEqual([
      'Fone de ouvido',
    ]);
    const visible = await (
      await call(viewer.token, 'GET', '/gifts/visible')
    ).json();
    expect(visible.owners).toEqual([
      expect.objectContaining({ user_id: owner.id, item_count: 1 }),
    ]);
  });

  it('does not expose lists to people who share no group with the owner', async () => {
    const { owner } = await scenario();
    const outsider = await userWithId();
    const otherGroupMember = await userWithId();
    const otherGroup = await orchestrator.createGroup(
      otherGroupMember.token,
      'Trabalho',
    );
    await orchestrator.joinGroup(outsider.token, otherGroup.invite_code);

    expect(
      (await call(outsider.token, 'GET', `/users/${owner.id}/gifts`)).status,
    ).toBe(404);
    expect(
      (await (await call(outsider.token, 'GET', '/gifts/visible')).json())
        .owners,
    ).toEqual([]);
  });

  it('lists the owner once even when several groups are in common', async () => {
    const { owner, viewer } = await scenario();
    const second = await orchestrator.createGroup(owner.token, 'Amigos');
    await orchestrator.joinGroup(viewer.token, second.invite_code);

    const visible = await (
      await call(viewer.token, 'GET', '/gifts/visible')
    ).json();

    expect(visible.owners).toHaveLength(1);
  });

  it('hides owners whose list is still empty', async () => {
    const { viewer } = await scenario();
    const quiet = await userWithId();
    const group = await orchestrator.createGroup(quiet.token, 'Vazio');
    await orchestrator.joinGroup(viewer.token, group.invite_code);
    await call(quiet.token, 'GET', '/gifts');

    const visible = await (
      await call(viewer.token, 'GET', '/gifts/visible')
    ).json();

    expect(
      visible.owners.map((o: { user_id: string }) => o.user_id),
    ).not.toContain(quiet.id);
  });

  it('removes access when the viewer or the owner leaves the last common group', async () => {
    const { owner, viewer, group } = await scenario();
    expect(
      (await call(viewer.token, 'GET', `/users/${owner.id}/gifts`)).status,
    ).toBe(200);

    await database.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [group.id, viewer.id],
    );
    expect(
      (await call(viewer.token, 'GET', `/users/${owner.id}/gifts`)).status,
    ).toBe(404);

    await orchestrator.joinGroup(viewer.token, group.invite_code);
    expect(
      (await call(viewer.token, 'GET', `/users/${owner.id}/gifts`)).status,
    ).toBe(200);
    await database.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [group.id, owner.id],
    );
    expect(
      (await call(viewer.token, 'GET', `/users/${owner.id}/gifts`)).status,
    ).toBe(404);
  });

  it('lets owners read their own list and stops access when the group is deleted', async () => {
    const { owner, viewer, group } = await scenario();

    const own = await call(owner.token, 'GET', `/users/${owner.id}/gifts`);
    expect(own.status).toBe(200);

    await database.query('DELETE FROM groups WHERE id = $1', [group.id]);
    expect(
      (await call(viewer.token, 'GET', `/users/${owner.id}/gifts`)).status,
    ).toBe(404);
  });

  it('returns 404 for unknown or malformed owner ids', async () => {
    const viewer = await userWithId();

    expect(
      (await call(viewer.token, 'GET', `/users/${crypto.randomUUID()}/gifts`))
        .status,
    ).toBe(404);
    expect((await call(viewer.token, 'GET', '/users/abc/gifts')).status).toBe(
      404,
    );
  });

  it('no longer has a sharing endpoint', async () => {
    const owner = await userWithId();

    expect((await call(owner.token, 'GET', '/gifts/sharing')).status).toBe(404);
  });
});
