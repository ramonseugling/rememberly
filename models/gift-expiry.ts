import { dateOnly, referenceDay } from '@/lib/mobile-calendar';
import database from 'infra/database';

export const EXPIRY_DAYS_AFTER_BIRTHDAY = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function lastBirthday(day: number, month: number, today: Date) {
  const thisYear = new Date(Date.UTC(today.getUTCFullYear(), month - 1, day));
  return thisYear > today
    ? new Date(Date.UTC(today.getUTCFullYear() - 1, month - 1, day))
    : thisYear;
}

// Once per birthday, a week after it: purchased gifts leave the list and the
// remaining reservations are cleared so the list starts fresh for the new year.
export async function expireGiftLists(today = referenceDay()) {
  const lists = await database.query(
    `SELECT l.id, l.created_at, l.expired_for::text AS expired_for,
            u.birth_day, u.birth_month
     FROM gift_lists l JOIN users u ON u.id = l.user_id
     WHERE u.birth_day IS NOT NULL AND u.birth_month IS NOT NULL`,
  );
  const summary = { lists: 0, removed: 0, released: 0 };
  for (const list of lists.rows) {
    const birthday = lastBirthday(list.birth_day, list.birth_month, today);
    const cutoff = new Date(
      birthday.getTime() + EXPIRY_DAYS_AFTER_BIRTHDAY * DAY_MS,
    );
    const birthdayKey = dateOnly(birthday);
    if (today < cutoff) continue;
    if (list.expired_for && list.expired_for >= birthdayKey) continue;
    const createdAfterCutoff = new Date(list.created_at) >= cutoff;
    const client = await database.getNewClient();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM gift_lists WHERE id = $1 FOR UPDATE', [
        list.id,
      ]);
      if (!createdAfterCutoff) {
        const removed = await client.query(
          `DELETE FROM gift_items i USING gift_reservations r
           WHERE i.list_id = $1 AND r.item_id = i.id AND r.status = 'purchased'`,
          [list.id],
        );
        const released = await client.query(
          `DELETE FROM gift_reservations r USING gift_items i
           WHERE r.item_id = i.id AND i.list_id = $1`,
          [list.id],
        );
        summary.removed += removed.rowCount ?? 0;
        summary.released += released.rowCount ?? 0;
      }
      await client.query(
        'UPDATE gift_lists SET expired_for = $2, updated_at = now() WHERE id = $1',
        [list.id, birthdayKey],
      );
      await client.query('COMMIT');
      summary.lists += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      await client.end();
    }
  }
  return summary;
}
