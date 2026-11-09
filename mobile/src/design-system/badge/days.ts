export type DaysTone = 'today' | 'soon' | 'neutral';

export const SOON_THRESHOLD_DAYS = 7;

export function daysBadge(
  days: number,
  farLabel: string,
): { label: string; tone: DaysTone } {
  if (days <= 0) return { label: 'Hoje 🎉', tone: 'today' };
  if (days <= SOON_THRESHOLD_DAYS) {
    return {
      label: `Em ${days} ${days === 1 ? 'dia' : 'dias'}`,
      tone: 'soon',
    };
  }
  return { label: farLabel, tone: 'neutral' };
}
