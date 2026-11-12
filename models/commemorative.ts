import {
  COMMEMORATIVE_DATES,
  COMMEMORATIVE_KEYS,
  type CommemorativeKey,
} from '@/lib/commemorative-dates';
import { getCommemorativeDate, getToday } from '@/lib/date-utils';
import database from 'infra/database';
import { ValidationError } from 'infra/errors';

export interface CommemorativeDateItem {
  key: CommemorativeKey;
  label: string;
  emoji: string;
  enabled: boolean;
  nextDate: string;
  daysUntil: number;
}

function validateKey(key: string): asserts key is CommemorativeKey {
  if (!COMMEMORATIVE_KEYS.includes(key)) {
    throw new ValidationError({
      message: `Chave de data comemorativa inválida: "${key}".`,
      action: `Use uma das chaves válidas: ${COMMEMORATIVE_KEYS.join(', ')}.`,
    });
  }
}

function computeNextOccurrence(
  key: CommemorativeKey,
  today: Date,
): { nextDate: Date; daysUntil: number } {
  const year = today.getFullYear();
  const thisYear = getCommemorativeDate(key, year);

  const todayMs = today.getTime();
  const thisYearMs = thisYear.getTime();

  const target =
    thisYearMs >= todayMs ? thisYear : getCommemorativeDate(key, year + 1);
  const daysUntil = Math.round(
    (target.getTime() - todayMs) / (1000 * 60 * 60 * 24),
  );

  return { nextDate: target, daysUntil };
}

function formatDate(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

async function listForUser(userId: string): Promise<CommemorativeDateItem[]> {
  const result = await database.query(
    `SELECT date_key FROM commemorative_subscriptions WHERE user_id = $1`,
    [userId],
  );

  const enabledKeys = new Set<string>(
    result.rows.map((r: { date_key: string }) => r.date_key),
  );
  const today = getToday();

  return COMMEMORATIVE_DATES.map((def) => {
    const { nextDate, daysUntil } = computeNextOccurrence(
      def.key as CommemorativeKey,
      today,
    );
    return {
      key: def.key as CommemorativeKey,
      label: def.label,
      emoji: def.emoji,
      enabled: enabledKeys.has(def.key),
      nextDate: formatDate(nextDate),
      daysUntil,
    };
  }).sort((a, b) => a.daysUntil - b.daysUntil);
}

async function enable(userId: string, dateKey: string): Promise<void> {
  validateKey(dateKey);
  await database.query(
    `INSERT INTO commemorative_subscriptions (user_id, date_key)
     VALUES ($1, $2)
     ON CONFLICT (user_id, date_key) DO NOTHING`,
    [userId, dateKey],
  );
}

async function disable(userId: string, dateKey: string): Promise<void> {
  validateKey(dateKey);
  await database.query(
    `DELETE FROM commemorative_subscriptions WHERE user_id = $1 AND date_key = $2`,
    [userId, dateKey],
  );
}

async function findSubscribersForDate(
  dateKey: string,
): Promise<{ email: string; name: string }[]> {
  const result = await database.query(
    `SELECT u.email, COALESCE(u.first_name, u.name) AS name
     FROM commemorative_subscriptions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN notification_preferences np ON np.user_id = u.id
     WHERE s.date_key = $1
       AND COALESCE(np.email_events, true)`,
    [dateKey],
  );
  return result.rows;
}

const commemorative = { listForUser, enable, disable, findSubscribersForDate };

export default commemorative;
