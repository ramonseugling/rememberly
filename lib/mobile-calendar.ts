import type { COMMEMORATIVE_DATES } from '@/lib/commemorative-dates';
import { getToday } from '@/lib/date-utils';

const DAY_MS = 86400000;
export const MOBILE_TIME_ZONE = 'America/Sao_Paulo';

export function referenceDay() {
  const today = getToday();
  return new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
}

export function dateOnly(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function occurrence(today: Date, inYear: (year: number) => Date) {
  const year = today.getUTCFullYear();
  const candidate = inYear(year);
  const target = candidate < today ? inYear(year + 1) : candidate;
  return {
    next_date: dateOnly(target),
    days_until: Math.round((target.getTime() - today.getTime()) / DAY_MS),
    is_next_year: target.getUTCFullYear() > year,
  };
}

export function annualOccurrence(day: number, month: number, today: Date) {
  return occurrence(today, (year) => new Date(Date.UTC(year, month - 1, day)));
}

export function commemorativeOccurrence(
  def: (typeof COMMEMORATIVE_DATES)[number],
  today: Date,
) {
  return occurrence(today, (year) => {
    if (def.kind === 'fixed')
      return new Date(Date.UTC(year, def.month - 1, def.day));
    const firstWeekday = new Date(Date.UTC(year, def.month - 1, 1)).getUTCDay();
    const day = 1 + ((7 - firstWeekday) % 7) + (def.n - 1) * 7;
    return new Date(Date.UTC(year, def.month - 1, day));
  });
}

export function compareStable(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}
