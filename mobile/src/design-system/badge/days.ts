export type DaysTone = 'today' | 'soon' | 'neutral';

export const SOON_THRESHOLD_DAYS = 7;
export const NEXT_YEAR_LABEL = 'Ano que vem';

function inDays(days: number): string {
  return `Em ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

export function daysBadge(
  days: number,
  farLabel?: string,
  nextYear?: boolean,
): { label: string; tone: DaysTone } {
  if (nextYear) return { label: NEXT_YEAR_LABEL, tone: 'neutral' };
  if (days <= 0) return { label: 'Hoje', tone: 'today' };
  if (days <= SOON_THRESHOLD_DAYS) return { label: inDays(days), tone: 'soon' };
  return { label: farLabel ?? inDays(days), tone: 'neutral' };
}
