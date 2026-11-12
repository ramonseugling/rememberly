import database from 'infra/database';
import { NotFoundError, ValidationError } from 'infra/errors';
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
  const { default: sharp } = await import('sharp');
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

// Used by the Google import: only fills an empty avatar, so a photo the
// person uploaded is never replaced.
async function setUserAvatarIfEmpty(userId: string, input: Buffer) {
  const current = await database.query(
    'SELECT avatar_url FROM users WHERE id = $1',
    [userId],
  );
  if (!current.rows[0] || current.rows[0].avatar_url) return null;
  const processed = await processPhoto(input);
  const url = await getStorage().put(
    `avatars/${userId}.webp`,
    processed,
    'image/webp',
  );
  const updated = await database.query(
    `UPDATE users SET avatar_url = $1, updated_at = NOW()
     WHERE id = $2 AND avatar_url IS NULL RETURNING avatar_url`,
    [url, userId],
  );
  return (updated.rows[0]?.avatar_url as string | undefined) ?? null;
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function assertGiftOwner(userId: string, itemId: string) {
  const found = UUID.test(itemId)
    ? await database.query(
        `SELECT i.photo_url FROM gift_items i
         JOIN gift_lists l ON l.id = i.list_id
         WHERE i.id = $1 AND l.user_id = $2`,
        [itemId, userId],
      )
    : null;
  if (!found?.rows[0])
    throw new NotFoundError({
      message: 'Presente não encontrado.',
      action: 'Atualize a lista e tente novamente.',
    });
  return (found.rows[0].photo_url ?? null) as string | null;
}

async function setGiftPhoto(userId: string, itemId: string, input: Buffer) {
  const previous = await assertGiftOwner(userId, itemId);
  const processed = await processPhoto(input);
  const url = await getStorage().put(
    `gifts/${itemId}.webp`,
    processed,
    'image/webp',
  );
  await database.query(
    'UPDATE gift_items SET photo_url = $1, updated_at = NOW() WHERE id = $2',
    [url, itemId],
  );
  await removeQuietly(previous);
  return { photo_url: url as string };
}

async function removeGiftPhoto(userId: string, itemId: string) {
  const previous = await assertGiftOwner(userId, itemId);
  await database.query(
    'UPDATE gift_items SET photo_url = NULL, updated_at = NOW() WHERE id = $1',
    [itemId],
  );
  await removeQuietly(previous);
}

const photo = {
  assertGiftOwner,
  setGiftPhoto,
  removeGiftPhoto,
  setUserAvatar,
  setUserAvatarIfEmpty,
  removeUserAvatar,
  setGroupPhoto,
  removeGroupPhoto,
  removeQuietly,
};

export default photo;
