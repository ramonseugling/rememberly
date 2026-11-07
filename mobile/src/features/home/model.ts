import type { AgendaItem } from '../dates/model.ts';
import type { Group } from '../groups/model.ts';

export function homeBirthdays(items: AgendaItem[]): AgendaItem[] {
  return items
    .filter((item) => item.type === 'birthday' && item.days_until >= 0)
    .sort(
      (a, b) =>
        a.days_until - b.days_until ||
        a.title.localeCompare(b.title, 'pt-BR') ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 3);
}
export function homeGroups(groups: Group[]): Group[] {
  return groups.slice(0, 2);
}
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'você';
}
