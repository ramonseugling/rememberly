export type DaysTone = 'today' | 'soon' | 'neutral';

export const SOON_THRESHOLD_DAYS = 7;

function inDays(days: number): string {
  return `Em ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

export function daysBadge(
  days: number,
  farLabel?: string,
): { label: string; tone: DaysTone } {
  if (days <= 0) return { label: 'Hoje', tone: 'today' };
  if (days <= SOON_THRESHOLD_DAYS) return { label: inDays(days), tone: 'soon' };
  return { label: farLabel ?? inDays(days), tone: 'neutral' };
}
