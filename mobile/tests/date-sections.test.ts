import assert from 'node:assert/strict';
import test from 'node:test';
import { dateSections } from '../src/features/dates/sections.ts';
import type { AgendaItem } from '../src/features/dates/model.ts';
const item = (days: number, date: string): AgendaItem => ({
  id: String(days),
  source: { kind: 'personal_event', event_id: String(days) },
  title: 'Data',
  type: 'birthday',
  custom_type: null,
  event_day: Number(date.slice(8)),
  event_month: Number(date.slice(5, 7)),
  reminder_days_before: 0,
  next_date: date,
  days_until: days,
  is_next_year: false,
  can_edit: true,
});
test('events use seven days, the actual calendar month, and chronological later dates', () => {
  const items = [
    item(17, '2026-12-05'),
    item(0, '2026-11-18'),
    item(9, '2026-11-27'),
    item(7, '2026-11-25'),
    item(12, '2026-11-30'),
    item(24, '2026-12-12'),
    item(40, '2026-12-28'),
    item(50, '2027-01-07'),
  ];
  const original = items.map((value) => value.id);
  const compact = dateSections(items, false, '2026-11-18');
  assert.deepEqual(
    compact.sections.map((section) =>
      section.data.map((value) => value.days_until),
    ),
    [
      [0, 7],
      [9, 12],
      [17, 24, 40],
    ],
  );
  assert.equal(compact.laterCount, 4);
  assert.equal(compact.upcomingCount, 4);
  assert.deepEqual(
    dateSections(items, true, '2026-11-18').sections[2].data.map(
      (value) => value.days_until,
    ),
    [17, 24, 40, 50],
  );
  assert.deepEqual(
    items.map((value) => value.id),
    original,
  );
  assert.deepEqual(dateSections([], false, '2026-11-18').sections, []);
});
test('an event in the next month remains in the seven-day section', () => {
  const items = [item(3, '2026-12-02'), item(8, '2026-12-07')];
  assert.deepEqual(
    dateSections(items, false, '2026-11-29').sections.map(
      (section) => section.title,
    ),
    ['Próximos 7 dias', 'Mais pra frente'],
  );
});
