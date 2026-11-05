import type { AgendaItem } from './model.ts';

export function dateSections(items: AgendaItem[], expanded: boolean) {
  const later = items.filter((item) => item.days_until > 30);
  return {
    sections: [
      {
        title: 'Próximos 7 dias',
        data: items.filter((item) => item.days_until <= 7),
      },
      {
        title: 'Este mês',
        data: items.filter(
          (item) => item.days_until > 7 && item.days_until <= 30,
        ),
      },
      { title: 'Mais pra frente', data: expanded ? later : later.slice(0, 3) },
    ].filter((section) => section.data.length > 0),
    laterCount: later.length,
    upcomingCount: items.filter((item) => item.days_until <= 30).length,
  };
}
