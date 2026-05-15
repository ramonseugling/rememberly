import digest from 'models/digest';

describe('digest.yesterdayBrtWindow', () => {
  test('às 12:00 UTC de 14/05 retorna janela [13/05 03:00 UTC, 14/05 03:00 UTC)', () => {
    const now = new Date(Date.UTC(2026, 4, 14, 12, 0, 0));
    const { start, end } = digest.yesterdayBrtWindow(now);

    expect(start.toISOString()).toBe('2026-05-13T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-05-14T03:00:00.000Z');
  });

  test('às 02:00 UTC (ainda dia anterior em BRT) retorna a janela correta', () => {
    const now = new Date(Date.UTC(2026, 4, 14, 2, 0, 0));
    const { start, end } = digest.yesterdayBrtWindow(now);

    expect(start.toISOString()).toBe('2026-05-12T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-05-13T03:00:00.000Z');
  });

  test('às 03:00 UTC (virada do dia BRT) começa a contar o dia novo', () => {
    const now = new Date(Date.UTC(2026, 4, 14, 3, 0, 0));
    const { start, end } = digest.yesterdayBrtWindow(now);

    expect(start.toISOString()).toBe('2026-05-13T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-05-14T03:00:00.000Z');
  });

  test('formatBrtDateLabel devolve dd/mm/yyyy do dia BRT', () => {
    const now = new Date(Date.UTC(2026, 4, 14, 12, 0, 0));
    const window = digest.yesterdayBrtWindow(now);
    expect(digest.formatBrtDateLabel(window)).toBe('13/05/2026');
  });

  test('virada de mês: 01/06 12:00 UTC retorna 31/05 como dateLabel', () => {
    const now = new Date(Date.UTC(2026, 5, 1, 12, 0, 0));
    const window = digest.yesterdayBrtWindow(now);
    expect(digest.formatBrtDateLabel(window)).toBe('31/05/2026');
  });
});
