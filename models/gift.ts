import type { Client } from 'pg';
import database from 'infra/database';
import { ConflictError, NotFoundError, ValidationError } from 'infra/errors';
import giftNotification from 'models/gift-notification';
import giftReservation from 'models/gift-reservation';

export const MAX_GIFT_ITEMS = 50;
const MAX_TITLE = 100;
const MAX_LINK = 2000;
const MAX_DESCRIPTION = 500;

export interface GiftItemInput {
  title: string;
  link?: string | null;
  description?: string | null;
}

export interface GiftItem {
  id: string;
  list_id: string;
  title: string;
  link: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export function normalizeGiftItem(input: GiftItemInput) {
  const title = (input.title ?? '').trim();
  if (!title) {
    throw new ValidationError({
      message: 'O nome do presente é obrigatório.',
      action: 'Informe o nome do presente.',
    });
  }
  if (title.length > MAX_TITLE) {
    throw new ValidationError({
      message: `O nome do presente deve ter no máximo ${MAX_TITLE} caracteres.`,
      action: 'Use um nome mais curto.',
    });
  }
  const link = (input.link ?? '').trim();
  if (link) validateLink(link);
  const description = (input.description ?? '').trim();
  if (description.length > MAX_DESCRIPTION) {
    throw new ValidationError({
      message: `A descrição deve ter no máximo ${MAX_DESCRIPTION} caracteres.`,
      action: 'Use uma descrição mais curta.',
    });
  }
  return {
    title,
    link: link || null,
    description: description || null,
  };
}

function validateLink(link: string) {
  let parsed: URL | null = null;
  try {
    parsed = new URL(link);
  } catch {
    parsed = null;
  }
  if (
    link.length > MAX_LINK ||
    !parsed ||
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password
  ) {
    throw new ValidationError({
      message: 'O link do presente é inválido.',
      action: 'Informe um link que comece com http:// ou https://.',
    });
  }
}

async function ensureList(userId: string) {
  const result = await database.query(
    `INSERT INTO gift_lists (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = excluded.user_id
     RETURNING id, user_id, created_at, updated_at`,
    [userId],
  );
  return result.rows[0] as {
    id: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
  };
}

async function createItem(userId: string, input: GiftItemInput) {
  const values = normalizeGiftItem(input);
  const list = await ensureList(userId);
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    // Serialize concurrent creations so the item limit cannot be bypassed.
    await client.query('SELECT id FROM gift_lists WHERE id = $1 FOR UPDATE', [
      list.id,
    ]);
    const count = await client.query(
      'SELECT COUNT(*)::int AS total FROM gift_items WHERE list_id = $1',
      [list.id],
    );
    if (count.rows[0].total >= MAX_GIFT_ITEMS) {
      throw new ValidationError({
        message: `Sua lista já tem ${MAX_GIFT_ITEMS} presentes.`,
        action: 'Remova algum presente para adicionar outro.',
      });
    }
    const result = await client.query(
      `INSERT INTO gift_items (list_id, title, link, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [list.id, values.title, values.link, values.description],
    );
    await client.query('COMMIT');
    return result.rows[0] as GiftItem;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function findItemsByUserId(userId: string) {
  const result = await database.query(
    `SELECT i.* FROM gift_items i
     JOIN gift_lists l ON l.id = i.list_id
     WHERE l.user_id = $1
     ORDER BY i.created_at DESC, i.id DESC`,
    [userId],
  );
  return result.rows as GiftItem[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound() {
  return new NotFoundError({
    message: 'Presente não encontrado.',
    action: 'Atualize a lista e tente novamente.',
  });
}

async function findItemById(userId: string, itemId: string) {
  if (!UUID.test(itemId)) throw notFound();
  const result = await database.query(
    `SELECT i.* FROM gift_items i
     JOIN gift_lists l ON l.id = i.list_id
     WHERE i.id = $1 AND l.user_id = $2`,
    [itemId, userId],
  );
  if (!result.rows[0]) throw notFound();
  return result.rows[0] as GiftItem;
}

// Locks the owner's item and applies the reservation rules: purchased items
// cannot change, reserved ones need the owner's confirmation and lose the claim.
async function lockItemForChange(
  client: Client,
  userId: string,
  itemId: string,
  confirm: boolean,
) {
  if (!UUID.test(itemId)) throw notFound();
  const found = await client.query(
    `SELECT i.* FROM gift_items i
     JOIN gift_lists l ON l.id = i.list_id
     WHERE i.id = $1 AND l.user_id = $2
     FOR UPDATE OF i`,
    [itemId, userId],
  );
  const item = found.rows[0] as GiftItem | undefined;
  if (!item) throw notFound();
  await giftReservation.releaseStale(client, item.list_id);
  const reservation = await client.query(
    'SELECT user_id, status FROM gift_reservations WHERE item_id = $1',
    [itemId],
  );
  const claim = reservation.rows[0];
  if (claim?.status === 'purchased') {
    throw new ConflictError({
      message: 'Este presente já foi comprado e não pode ser alterado.',
      action: 'Adicione um novo presente se quiser outro.',
      reason: 'purchased',
    });
  }
  if (claim && !confirm) {
    throw new ConflictError({
      message: 'Este presente já foi reservado por alguém.',
      action: 'Confirme para continuar; a reserva será cancelada.',
      reason: 'reserved',
    });
  }
  if (claim)
    await client.query('DELETE FROM gift_reservations WHERE item_id = $1', [
      itemId,
    ]);
  return { item, releasedUserId: (claim?.user_id ?? null) as string | null };
}

async function updateItem(
  userId: string,
  itemId: string,
  changes: Partial<GiftItemInput>,
  { confirm = false }: { confirm?: boolean } = {},
) {
  let released: string | null = null;
  const updated = await giftReservation.withClient(async (client) => {
    const locked = await lockItemForChange(client, userId, itemId, confirm);
    const current = locked.item;
    released = locked.releasedUserId;
    const values = normalizeGiftItem({
      title: changes.title !== undefined ? changes.title : current.title,
      link: changes.link !== undefined ? changes.link : current.link,
      description:
        changes.description !== undefined
          ? changes.description
          : current.description,
    });
    const result = await client.query(
      `UPDATE gift_items SET title = $1, link = $2, description = $3, updated_at = now()
       WHERE id = $4 RETURNING *`,
      [values.title, values.link, values.description, itemId],
    );
    return result.rows[0] as GiftItem;
  });
  if (released)
    await giftNotification.notifyReleased({
      reserverId: released,
      ownerId: userId,
      giftTitle: updated.title,
      action: 'edited',
    });
  return updated;
}

async function deleteItem(
  userId: string,
  itemId: string,
  { confirm = false }: { confirm?: boolean } = {},
) {
  let released: { id: string | null; title: string } = { id: null, title: '' };
  await giftReservation.withClient(async (client) => {
    const locked = await lockItemForChange(client, userId, itemId, confirm);
    released = { id: locked.releasedUserId, title: locked.item.title };
    await client.query('DELETE FROM gift_items WHERE id = $1', [itemId]);
  });
  if (released.id)
    await giftNotification.notifyReleased({
      reserverId: released.id,
      ownerId: userId,
      giftTitle: released.title,
      action: 'deleted',
    });
}

export function presentGiftItem(item: GiftItem) {
  return {
    id: item.id,
    title: item.title,
    link: item.link,
    description: item.description,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

const gift = {
  ensureList,
  createItem,
  findItemsByUserId,
  findItemById,
  updateItem,
  deleteItem,
};

export default gift;
