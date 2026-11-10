import database from 'infra/database';
import { NotFoundError } from 'infra/errors';
import { presentGiftItem } from 'models/gift';
import type { GiftItem } from 'models/gift';
import giftReservation from 'models/gift-reservation';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A list is visible to everyone who shares at least one group with its owner.
// EXISTS keeps it to one row even when several groups are shared.
const canView = (list: string) => `EXISTS (
  SELECT 1 FROM group_members viewer_member
  JOIN group_members owner_member
    ON owner_member.group_id = viewer_member.group_id
  WHERE viewer_member.user_id = $1 AND owner_member.user_id = ${list}.user_id
)`;

async function findVisibleOwners(viewerId: string) {
  const result = await database.query(
    `SELECT u.id AS user_id, u.name, u.avatar_url,
            (SELECT COUNT(*)::int FROM gift_items i WHERE i.list_id = l.id) AS item_count
     FROM gift_lists l
     JOIN users u ON u.id = l.user_id
     WHERE l.user_id <> $1 AND ${canView('l')}
       AND EXISTS (SELECT 1 FROM gift_items i2 WHERE i2.list_id = l.id)
     ORDER BY u.name, u.id`,
    [viewerId],
  );
  return result.rows as {
    user_id: string;
    name: string;
    avatar_url: string | null;
    item_count: number;
  }[];
}

async function findListForViewer(viewerId: string, ownerId: string) {
  if (!UUID.test(ownerId)) throw listNotFound();
  const owner = await database.query(
    `SELECT u.id, u.name, u.avatar_url, u.birth_day, u.birth_month, u.birth_year, l.id AS list_id
     FROM users u LEFT JOIN gift_lists l ON l.user_id = u.id
     WHERE u.id = $2
       AND ($1 = u.id OR EXISTS (
         SELECT 1 FROM gift_lists l2 WHERE l2.user_id = u.id
           AND ${canView('l2')}
       ))`,
    [viewerId, ownerId],
  );
  const row = owner.rows[0];
  if (!row) throw listNotFound();
  const groups =
    viewerId === ownerId
      ? []
      : (
          await database.query(
            `SELECT g.name FROM groups g
             JOIN group_members a ON a.group_id = g.id AND a.user_id = $1
             JOIN group_members b ON b.group_id = g.id AND b.user_id = $2
             ORDER BY g.name, g.id`,
            [viewerId, ownerId],
          )
        ).rows.map((group) => group.name as string);
  const items = row.list_id
    ? ((
        await database.query(
          `SELECT * FROM gift_items WHERE list_id = $1
           ORDER BY created_at DESC, id DESC`,
          [row.list_id],
        )
      ).rows as GiftItem[])
    : [];
  const claims = new Map(
    row.list_id && viewerId !== ownerId
      ? (await giftReservation.findForList(row.list_id)).map((c) => [
          c.item_id,
          c,
        ])
      : [],
  );
  return {
    owner: {
      id: row.id as string,
      name: row.name as string,
      avatar_url: (row.avatar_url ?? null) as string | null,
      birth_day: (row.birth_day ?? null) as number | null,
      birth_month: (row.birth_month ?? null) as number | null,
      birth_year: (row.birth_year ?? null) as number | null,
    },
    groups,
    items: items.map((item) => {
      if (viewerId === ownerId) return presentGiftItem(item);
      const claim = claims.get(item.id);
      return {
        ...presentGiftItem(item),
        availability: claim?.status ?? 'available',
        reserved_by_me: claim?.user_id === viewerId,
      };
    }),
  };
}

function listNotFound() {
  return new NotFoundError({
    message: 'Lista de presentes não encontrada.',
    action: 'Você precisa estar em um grupo com essa pessoa.',
  });
}

const giftVisibility = {
  findVisibleOwners,
  findListForViewer,
};

export default giftVisibility;
