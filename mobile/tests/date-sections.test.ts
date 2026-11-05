import assert from 'node:assert/strict';
import test from 'node:test';
import { dateSections } from '../src/features/dates/sections.ts';
import type { AgendaItem } from '../src/features/dates/model.ts';

const item = (days: number): AgendaItem => ({
  id: String(days),
  source: { kind: 'personal_event', event_id: String(days) },
  title: 'Data',
  type: 'birthday',
  custom_type: null,
  event_day: 1,
  event_month: 1,
  reminder_days_before: 0,
  next_date: '2027-01-01',
  days_until: days,
  is_next_year: false,
  can_edit: true,
});
test('web section boundaries include 7 and 30, and later expands without reordering', () => {
  const items = [0, 1, 7, 8, 30, 31, 32, 33, 34].map(item);
  const compact = dateSections(items, false);
  assert.deepEqual(
    compact.sections.map((section) =>
      section.data.map((event) => event.days_until),
    ),
    [
      [0, 1, 7],
      [8, 30],
      [31, 32, 33],
    ],
  );
  assert.equal(compact.upcomingCount, 5);
  assert.equal(compact.laterCount, 4);
  assert.deepEqual(
    dateSections(items, true).sections[2].data.map((event) => event.days_until),
    [31, 32, 33, 34],
  );
  assert.deepEqual(dateSections([], false).sections, []);
});
