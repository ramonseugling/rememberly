import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import orchestrator from 'tests/orchestrator';

const BASE = 'http://localhost:3000';

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

function put(token: string, body: Buffer | string, type = 'image/png') {
  return fetch(`${BASE}/api/v1/users/avatar`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': type },
    body: body as BodyInit,
  });
}

async function me(token: string) {
  const response = await fetch(`${BASE}/api/v1/mobile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await response.json()).user;
}

describe('PUT/DELETE /api/v1/users/avatar', () => {
  it('stores a square 512 px WebP and exposes avatar_url', async () => {
    const token = await orchestrator.createUserAndToken();

    const response = await put(token, await pngImage());

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.avatar_url).toMatch(/\/uploads\/avatars\/.+\.webp$/);
    const metadata = await sharp(
      await readFile(localFile(data.avatar_url)),
    ).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(512);
    expect(metadata.height).toBe(512);
    expect((await me(token)).avatar_url).toBe(data.avatar_url);
  });

  it('replaces the previous photo and removes the old file', async () => {
    const token = await orchestrator.createUserAndToken();
    const first = await (await put(token, await pngImage())).json();
    const second = await (await put(token, await pngImage(300, 300))).json();

    expect(second.avatar_url).not.toBe(first.avatar_url);
    expect(existsSync(localFile(first.avatar_url))).toBe(false);
    expect(existsSync(localFile(second.avatar_url))).toBe(true);
  });

  it('removes the photo with DELETE', async () => {
    const token = await orchestrator.createUserAndToken();
    const { avatar_url } = await (await put(token, await pngImage())).json();

    const response = await fetch(`${BASE}/api/v1/users/avatar`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(204);
    expect(existsSync(localFile(avatar_url))).toBe(false);
    expect((await me(token)).avatar_url).toBeNull();
  });

  it('rejects non-image content types and invalid image data', async () => {
    const token = await orchestrator.createUserAndToken();

    const wrongType = await put(token, 'hello', 'text/plain');
    expect(wrongType.status).toBe(400);

    const notAnImage = await put(token, Buffer.from('not really an image'));
    expect(notAnImage.status).toBe(400);
    expect((await notAnImage.json()).name).toBe('ValidationError');

    const gif = await sharp({
      create: { width: 20, height: 20, channels: 3, background: '#fff' },
    })
      .gif()
      .toBuffer();
    expect((await put(token, gif, 'image/gif')).status).toBe(400);
  });

  it('rejects images larger than 2 MB', async () => {
    const token = await orchestrator.createUserAndToken();

    const response = await put(token, randomBytes(3 * 1024 * 1024));

    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe('A imagem é grande demais.');
  });

  it('requires authentication', async () => {
    const put401 = await fetch(`${BASE}/api/v1/users/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: (await pngImage()) as BodyInit,
    });
    expect(put401.status).toBe(401);
    const delete401 = await fetch(`${BASE}/api/v1/users/avatar`, {
      method: 'DELETE',
    });
    expect(delete401.status).toBe(401);
  });
});
