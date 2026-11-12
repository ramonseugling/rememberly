import { getBirthdayInfo } from '@/lib/date-utils';
import database from 'infra/database';

export interface GiftPreview {
  firstName: string;
  daysUntil: number | null;
  avatarUrl: string | null;
}

// Only what the public link preview shows: first name, days to the birthday
// and the profile photo. The gift items themselves stay behind the groups.
async function findGiftPreview(userId: string): Promise<GiftPreview | null> {
  const result = await database.query(
    `SELECT COALESCE(first_name, split_part(btrim(name), ' ', 1)) AS first_name,
            birth_day, birth_month, avatar_url
     FROM users WHERE id = $1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    firstName: row.first_name,
    daysUntil: getBirthdayInfo(row.birth_day, row.birth_month).daysUntil,
    avatarUrl: row.avatar_url ?? null,
  };
}

const giftPreview = { findGiftPreview };

export default giftPreview;
