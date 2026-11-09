import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import orchestrator from 'tests/orchestrator';

const BASE = 'http://localhost:3000';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

function pngImage() {
  return sharp({
    create: { width: 640, height: 480, channels: 3, background: '#ed5e8e' },
  })
    .png()
    .toBuffer();
}

function localFile(url: string) {
  const relative = url.slice(url.indexOf('/uploads/') + '/uploads/'.length);
  return path.join(process.cwd(), 'public', 'uploads', relative);
}

async function putPhoto(token: string, groupId: string) {
  return fetch(`${BASE}/api/v1/groups/${groupId}/photo`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' },
    body: (await pngImage()) as BodyInit,
  });
}

describe('PUT/DELETE /api/v1/groups/[id]/photo', () => {
  it('lets the owner set the photo and exposes it in the group payloads', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Família');

    const response = await putPhoto(ownerToken, group.id);

    expect(response.status).toBe(200);
    const { photo_url } = await response.json();
    expect(photo_url).toMatch(/\/uploads\/groups\/.+\.webp$/);

    const list = await (
      await fetch(`${BASE}/api/v1/groups`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
    ).json();
    expect(list[0].photo_url).toBe(photo_url);

    const detail = await (
      await fetch(`${BASE}/api/v1/groups/${group.id}`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
    ).json();
    expect(detail.photo_url).toBe(photo_url);
  });

  it('forbids members who are not the owner and outsiders', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const memberToken = await orchestrator.createUserAndToken();
    const outsiderToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Amigos');
    await orchestrator.joinGroup(memberToken, group.invite_code);

    expect((await putPhoto(memberToken, group.id)).status).toBe(401);
    expect((await putPhoto(outsiderToken, group.id)).status).not.toBe(200);
    const memberDelete = await fetch(
      `${BASE}/api/v1/groups/${group.id}/photo`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${memberToken}` },
      },
    );
    expect(memberDelete.status).toBe(401);
  });

  it('removes the file with DELETE and when the group is deleted', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const first = await orchestrator.createGroup(ownerToken, 'Time');
    const second = await orchestrator.createGroup(ownerToken, 'Trabalho');
    const firstUrl = (await (await putPhoto(ownerToken, first.id)).json())
      .photo_url;
    const secondUrl = (await (await putPhoto(ownerToken, second.id)).json())
      .photo_url;

    const removed = await fetch(`${BASE}/api/v1/groups/${first.id}/photo`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(removed.status).toBe(204);
    expect(existsSync(localFile(firstUrl))).toBe(false);

    const deleted = await fetch(`${BASE}/api/v1/groups/${second.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(deleted.status).toBe(204);
    expect(existsSync(localFile(secondUrl))).toBe(false);
  });

  it('shows member avatars to the other members of the group', async () => {
    const ownerToken = await orchestrator.createUserAndToken();
    const memberToken = await orchestrator.createUserAndToken();
    const group = await orchestrator.createGroup(ownerToken, 'Casa');
    await orchestrator.joinGroup(memberToken, group.invite_code);
    const avatar = await fetch(`${BASE}/api/v1/users/avatar`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${memberToken}`,
        'Content-Type': 'image/png',
      },
      body: (await pngImage()) as BodyInit,
    });
    const { avatar_url } = await avatar.json();

    const members = await (
      await fetch(`${BASE}/api/v1/groups/${group.id}/members`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
    ).json();

    expect(
      members.some(
        (entry: { avatar_url: string }) => entry.avatar_url === avatar_url,
      ),
    ).toBe(true);
  });
});
