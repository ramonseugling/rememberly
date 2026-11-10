import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import orchestrator from 'tests/orchestrator';

const BASE = 'http://localhost:3000/api/v1';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

function pngImage(width = 800, height = 600) {
  return sharp({
    create: { width, height, channels: 3, background: '#e53565' },
  })
    .png()
    .toBuffer();
}

function localFile(url: string) {
  const relative = url.slice(url.indexOf('/uploads/') + '/uploads/'.length);
  return path.join(process.cwd(), 'public', 'uploads', relative);
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function createItem(token: string) {
  const response = await fetch(`${BASE}/gifts`, {
    method: 'POST',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Fone de ouvido' }),
  });
  return (await response.json()) as { id: string };
}

function put(
  token: string,
  itemId: string,
  body: Buffer | string,
  type = 'image/png',
) {
  return fetch(`${BASE}/gifts/${itemId}/photo`, {
    method: 'PUT',
    headers: { ...auth(token), 'Content-Type': type },
    body: body as BodyInit,
  });
}

function remove(token: string, itemId: string) {
  return fetch(`${BASE}/gifts/${itemId}/photo`, {
    method: 'DELETE',
    headers: auth(token),
  });
}

async function ownItems(token: string) {
  const response = await fetch(`${BASE}/gifts`, { headers: auth(token) });
  return (await response.json()).items as {
    id: string;
    photo_url: string | null;
  }[];
}

describe('PUT/DELETE /api/v1/gifts/[id]/photo', () => {
  it('starts without a photo and stores a square 512 px WebP', async () => {
    const token = await orchestrator.createUserAndToken();
    const item = await createItem(token);
    expect((await ownItems(token))[0]?.photo_url).toBeNull();

    const response = await put(token, item.id, await pngImage());

    expect(response.status).toBe(200);
    const { photo_url } = await response.json();
    expect(photo_url).toMatch(/\/uploads\/gifts\/.+\.webp$/);
    const metadata = await sharp(localFile(photo_url)).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(512);
    expect(metadata.height).toBe(512);
    expect((await ownItems(token))[0]?.photo_url).toBe(photo_url);
  });

  it('replaces the previous photo and removes the old file', async () => {
    const token = await orchestrator.createUserAndToken();
    const item = await createItem(token);
    const first = await (await put(token, item.id, await pngImage())).json();
    const second = await (
      await put(token, item.id, await pngImage(300, 300))
    ).json();

    expect(second.photo_url).not.toBe(first.photo_url);
    expect(existsSync(localFile(first.photo_url))).toBe(false);
    expect(existsSync(localFile(second.photo_url))).toBe(true);
  });

  it('removes the photo with DELETE', async () => {
    const token = await orchestrator.createUserAndToken();
    const item = await createItem(token);
    const { photo_url } = await (
      await put(token, item.id, await pngImage())
    ).json();

    const response = await remove(token, item.id);

    expect(response.status).toBe(204);
    expect(existsSync(localFile(photo_url))).toBe(false);
    expect((await ownItems(token))[0]?.photo_url).toBeNull();
  });

  it('removes the file when the gift is deleted', async () => {
    const token = await orchestrator.createUserAndToken();
    const item = await createItem(token);
    const { photo_url } = await (
      await put(token, item.id, await pngImage())
    ).json();

    const response = await fetch(`${BASE}/gifts/${item.id}`, {
      method: 'DELETE',
      headers: auth(token),
    });

    expect(response.status).toBe(204);
    expect(existsSync(localFile(photo_url))).toBe(false);
  });

  it('shows the photo to group members', async () => {
    const { user, session } = await orchestrator.createUserAndSession();
    const viewer = await orchestrator.createUserAndToken();
    const item = await createItem(session.token);
    const group = await orchestrator.createGroup(session.token);
    await orchestrator.joinGroup(viewer, group.invite_code);
    const { photo_url } = await (
      await put(session.token, item.id, await pngImage())
    ).json();

    const response = await fetch(`${BASE}/users/${user.id}/gifts`, {
      headers: auth(viewer),
    });

    expect(response.status).toBe(200);
    expect((await response.json()).items[0].photo_url).toBe(photo_url);
  });

  it('only lets the owner change the photo', async () => {
    const owner = await orchestrator.createUserAndToken();
    const stranger = await orchestrator.createUserAndToken();
    const item = await createItem(owner);

    expect((await put(stranger, item.id, await pngImage())).status).toBe(404);
    expect((await remove(stranger, item.id)).status).toBe(404);
    expect((await put(owner, 'not-a-uuid', await pngImage())).status).toBe(404);
  });

  it('rejects non-image content types, invalid data and large files', async () => {
    const token = await orchestrator.createUserAndToken();
    const item = await createItem(token);

    expect((await put(token, item.id, 'hello', 'text/plain')).status).toBe(400);
    const notAnImage = await put(token, item.id, Buffer.from('not an image'));
    expect(notAnImage.status).toBe(400);
    const tooLarge = await put(token, item.id, randomBytes(3 * 1024 * 1024));
    expect(tooLarge.status).toBe(400);
    expect((await ownItems(token))[0]?.photo_url).toBeNull();
  });

  it('requires authentication', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    const putResponse = await fetch(`${BASE}/gifts/${id}/photo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: (await pngImage()) as BodyInit,
    });
    expect(putResponse.status).toBe(401);
    const deleteResponse = await fetch(`${BASE}/gifts/${id}/photo`, {
      method: 'DELETE',
    });
    expect(deleteResponse.status).toBe(401);
  });
});
