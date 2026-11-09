import { del, put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ServiceError } from 'infra/errors';

export interface Storage {
  put(key: string, data: Buffer, contentType: string): Promise<string>;
  remove(url: string): Promise<void>;
}

const LOCAL_PREFIX = '/uploads/';

function uniqueKey(key: string) {
  const extension = path.extname(key);
  return `${key.slice(0, key.length - extension.length)}-${randomUUID()}${extension}`;
}

export const vercelBlobStorage: Storage = {
  async put(key, data, contentType) {
    const blob = await put(uniqueKey(key), data, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  },
  async remove(url) {
    await del(url);
  },
};

function localDirectory() {
  return path.join(process.cwd(), 'public', 'uploads');
}

export const localStorage: Storage = {
  async put(key, data) {
    const unique = uniqueKey(key);
    const target = path.join(localDirectory(), unique);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
    const base = (process.env.APP_URL ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    return `${base}${LOCAL_PREFIX}${unique.split(path.sep).join('/')}`;
  },
  async remove(url) {
    const index = url.indexOf(LOCAL_PREFIX);
    if (index === -1) return;
    const relative = url.slice(index + LOCAL_PREFIX.length);
    const target = path.join(localDirectory(), relative);
    if (!target.startsWith(localDirectory() + path.sep)) return;
    await rm(target, { force: true });
  },
};

export function getStorage(): Storage {
  if (process.env.BLOB_READ_WRITE_TOKEN) return vercelBlobStorage;
  if (process.env.NODE_ENV === 'production') {
    throw new ServiceError({
      message: 'O armazenamento de fotos não está configurado.',
      action: 'Tente novamente mais tarde.',
    });
  }
  return localStorage;
}
