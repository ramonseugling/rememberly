import digest from 'models/digest';

describe('digest.yesterdayBrtWindow', () => {
  test('at 12:00 UTC on 05/14 returns window [05/13 03:00 UTC, 05/14 03:00 UTC)', () => {
    const now = new Date(Date.UTC(2026, 4, 14, 12, 0, 0));
    const { start, end } = digest.yesterdayBrtWindow(now);

    expect(start.toISOString()).toBe('2026-05-13T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-05-14T03:00:00.000Z');
  });

  test('at 02:00 UTC (still the previous day in BRT) returns the correct window', () => {
    const now = new Date(Date.UTC(2026, 4, 14, 2, 0, 0));
    const { start, end } = digest.yesterdayBrtWindow(now);

    expect(start.toISOString()).toBe('2026-05-12T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-05-13T03:00:00.000Z');
  });

  test('at 03:00 UTC (BRT day rollover) starts counting the new day', () => {
    const now = new Date(Date.UTC(2026, 4, 14, 3, 0, 0));
    const { start, end } = digest.yesterdayBrtWindow(now);

    expect(start.toISOString()).toBe('2026-05-13T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-05-14T03:00:00.000Z');
  });

  test('formatBrtDateLabel returns dd/mm/yyyy of the BRT day', () => {
    const now = new Date(Date.UTC(2026, 4, 14, 12, 0, 0));
    const window = digest.yesterdayBrtWindow(now);
    expect(digest.formatBrtDateLabel(window)).toBe('13/05/2026');
  });

  test('month rollover: 06/01 12:00 UTC returns 05/31 as dateLabel', () => {
    const now = new Date(Date.UTC(2026, 5, 1, 12, 0, 0));
    const window = digest.yesterdayBrtWindow(now);
    expect(digest.formatBrtDateLabel(window)).toBe('31/05/2026');
  });
});
