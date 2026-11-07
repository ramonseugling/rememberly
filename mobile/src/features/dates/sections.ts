import type { AgendaItem } from './model.ts';
export function dateSections(
  items: AgendaItem[],
  expanded: boolean,
  today = '',
) {
  const ordered = [...items].sort(
    (a, b) =>
      a.days_until - b.days_until ||
      a.title.localeCompare(b.title, 'pt-BR') ||
      a.id.localeCompare(b.id),
  );
  const thisMonth = today.slice(0, 7);
  const near = ordered.filter(
    (item) => item.days_until >= 0 && item.days_until <= 7,
  );
  const month = ordered.filter(
    (item) => item.days_until > 7 && item.next_date.slice(0, 7) === thisMonth,
  );
  const later = ordered.filter(
    (item) => item.days_until > 7 && item.next_date.slice(0, 7) !== thisMonth,
  );
  return {
    sections: [
      { title: 'Próximos 7 dias', data: near },
      { title: 'Este mês', data: month },
      { title: 'Mais pra frente', data: expanded ? later : later.slice(0, 3) },
    ].filter((section) => section.data.length > 0),
    laterCount: later.length,
    upcomingCount: near.length + month.length,
  };
}
