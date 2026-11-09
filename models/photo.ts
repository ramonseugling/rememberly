import sharp from 'sharp';
import database from 'infra/database';
import { ValidationError } from 'infra/errors';
import { getStorage } from 'infra/storage';

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_SIZE = 512;
const ACCEPTED_FORMATS = ['jpeg', 'png', 'webp'];

async function processPhoto(input: Buffer) {
  if (!input.length) {
    throw new ValidationError({
      message: 'Nenhuma imagem foi enviada.',
      action: 'Envie uma imagem JPEG, PNG ou WebP de até 2 MB.',
    });
  }
  try {
    const image = sharp(input, { limitInputPixels: 40_000_000 });
    const { format } = await image.metadata();
    if (!format || !ACCEPTED_FORMATS.includes(format)) throw new Error('type');
    return await image
      .rotate()
      .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover' })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ValidationError({
      message: 'Formato de imagem inválido.',
      action: 'Envie uma imagem JPEG, PNG ou WebP de até 2 MB.',
    });
  }
}

async function removeQuietly(url: string | null | undefined) {
  if (!url) return;
  try {
    await getStorage().remove(url);
  } catch {
    // Orphaned files are acceptable; a failed cleanup must not fail the request.
  }
}

async function setUserAvatar(userId: string, input: Buffer) {
  const processed = await processPhoto(input);
  const url = await getStorage().put(
    `avatars/${userId}.webp`,
    processed,
    'image/webp',
  );
  const previous = await database.query(
    'SELECT avatar_url FROM users WHERE id = $1',
    [userId],
  );
  await database.query(
    'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
    [url, userId],
  );
  await removeQuietly(previous.rows[0]?.avatar_url);
  return { avatar_url: url as string };
}

async function removeUserAvatar(userId: string) {
  const previous = await database.query(
    'SELECT avatar_url FROM users WHERE id = $1',
    [userId],
  );
  await database.query(
    'UPDATE users SET avatar_url = NULL, updated_at = NOW() WHERE id = $1',
    [userId],
  );
  await removeQuietly(previous.rows[0]?.avatar_url);
}

async function setGroupPhoto(groupId: string, input: Buffer) {
  const processed = await processPhoto(input);
  const url = await getStorage().put(
    `groups/${groupId}.webp`,
    processed,
    'image/webp',
  );
  const previous = await database.query(
    'SELECT photo_url FROM groups WHERE id = $1',
    [groupId],
  );
  await database.query(
    'UPDATE groups SET photo_url = $1, updated_at = NOW() WHERE id = $2',
    [url, groupId],
  );
  await removeQuietly(previous.rows[0]?.photo_url);
  return { photo_url: url as string };
}

async function removeGroupPhoto(groupId: string) {
  const previous = await database.query(
    'SELECT photo_url FROM groups WHERE id = $1',
    [groupId],
  );
  await database.query(
    'UPDATE groups SET photo_url = NULL, updated_at = NOW() WHERE id = $1',
    [groupId],
  );
  await removeQuietly(previous.rows[0]?.photo_url);
}

const photo = {
  setUserAvatar,
  removeUserAvatar,
  setGroupPhoto,
  removeGroupPhoto,
  removeQuietly,
};

export default photo;
