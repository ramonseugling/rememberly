import type { Client } from 'pg';
import database from 'infra/database';
import { ConflictError, NotFoundError } from 'infra/errors';

export type ReservationStatus = 'reserved' | 'purchased';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Reservation {
  item_id: string;
  user_id: string;
  status: ReservationStatus;
}

function itemNotFound() {
  return new NotFoundError({
    message: 'Presente não encontrado.',
    action: 'Atualize a lista e tente novamente.',
  });
}

// A "reserved" claim only lasts while the reserver can still see the list;
// "purchased" is kept because the gift was already bought.
async function releaseStale(client: Client, listId: string) {
  await client.query(
    `DELETE FROM gift_reservations r
     USING gift_items i, gift_lists l
     WHERE r.item_id = i.id AND i.list_id = l.id AND l.id = $1
       AND r.status = 'reserved'
       AND r.via_link = false
       AND NOT EXISTS (
         SELECT 1 FROM group_members viewer_member
         JOIN group_members owner_member
           ON owner_member.group_id = viewer_member.group_id AND owner_member.user_id = l.user_id
         WHERE viewer_member.user_id = r.user_id
       )`,
    [listId],
  );
}

async function withClient<T>(run: (client: Client) => Promise<T>) {
  const client = await database.getNewClient();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function findForList(listId: string) {
  return withClient(async (client) => {
    await releaseStale(client, listId);
    const result = await client.query(
      `SELECT r.item_id, r.user_id, r.status
       FROM gift_reservations r JOIN gift_items i ON i.id = r.item_id
       WHERE i.list_id = $1`,
      [listId],
    );
    return result.rows as Reservation[];
  });
}

async function reserve(
  viewerId: string,
  itemId: string,
  status: ReservationStatus,
  token: string | null = null,
) {
  if (!UUID.test(itemId)) throw itemNotFound();
  return withClient(async (client) => {
    const target = await client.query(
      `SELECT i.id, l.id AS list_id, l.user_id AS owner_id,
              EXISTS (
                SELECT 1 FROM group_members viewer_member
         JOIN group_members owner_member
           ON owner_member.group_id = viewer_member.group_id AND owner_member.user_id = l.user_id
         WHERE viewer_member.user_id = $2
              ) AS can_view,
              ($3::text IS NOT NULL AND l.share_token = $3) AS has_link
       FROM gift_items i JOIN gift_lists l ON l.id = i.list_id
       WHERE i.id = $1
       FOR UPDATE OF i`,
      [itemId, viewerId, token],
    );
    const row = target.rows[0];
    if (!row || !(row.can_view || row.has_link) || row.owner_id === viewerId)
      throw itemNotFound();
    await releaseStale(client, row.list_id);
    const inserted = await client.query(
      `INSERT INTO gift_reservations (item_id, user_id, status, via_link)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (item_id) DO UPDATE
         SET status = excluded.status, updated_at = now()
         WHERE gift_reservations.user_id = excluded.user_id
       RETURNING item_id, user_id, status`,
      [itemId, viewerId, status, !row.can_view],
    );
    if (!inserted.rows[0]) {
      throw new ConflictError({
        message: 'Este presente já foi reservado por outra pessoa.',
        action: 'Escolha outro presente da lista.',
        reason: 'taken',
      });
    }
    return inserted.rows[0] as Reservation;
  });
}

async function cancel(viewerId: string, itemId: string) {
  if (!UUID.test(itemId)) throw itemNotFound();
  const result = await database.query(
    `DELETE FROM gift_reservations WHERE item_id = $1 AND user_id = $2`,
    [itemId, viewerId],
  );
  if (!result.rowCount) throw itemNotFound();
}

const giftReservation = {
  releaseStale,
  withClient,
  findForList,
  reserve,
  cancel,
};

export default giftReservation;
