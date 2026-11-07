import assert from 'node:assert/strict';
import test from 'node:test';
import {
  firstName,
  homeBirthdays,
  homeGroups,
} from '../src/features/home/model.ts';
import type { AgendaItem } from '../src/features/dates/model.ts';
import type { Group } from '../src/features/groups/model.ts';

function event(
  id: string,
  days: number,
  type: AgendaItem['type'] = 'birthday',
): AgendaItem {
  return {
    id,
    title: id,
    type,
    custom_type: null,
    event_day: 1,
    event_month: 1,
    reminder_days_before: 0,
    next_date: '2027-01-01',
    days_until: days,
    is_next_year: true,
    can_edit: true,
    source: { kind: 'personal_event', event_id: id },
  };
}
test('home shows only three nearest birthdays including today and next year without mutating the agenda', () => {
  const items = [
    event('later', 80),
    event('custom', 0, 'custom'),
    event('next', 7),
    event('today', 0),
    event('soon', 2),
    event('past', -1),
  ];
  const original = items.map((item) => item.id);
  assert.deepEqual(
    homeBirthdays(items).map((item) => item.id),
    ['today', 'soon', 'next'],
  );
  assert.deepEqual(
    items.map((item) => item.id),
    original,
  );
});
test('home preserves group birthdays and does not merge different people by name', () => {
  const personal = event('personal', 4);
  personal.title = 'Ana';
  const group = event('group', 1);
  group.title = 'Ana';
  group.source = {
    kind: 'group_birthday',
    user_id: 'member',
    group_name: 'Família',
    group_count: 2,
  };
  group.can_edit = false;
  assert.deepEqual(
    homeBirthdays([personal, group]).map((item) => item.id),
    ['group', 'personal'],
  );
  assert.deepEqual(homeBirthdays([]), []);
});
test('home groups preserve server ordering and show at most two', () => {
  const groups: Group[] = ['third', 'first', 'second'].map((id) => ({
    id,
    name: id,
    invite_code: 'example',
    role: 'member',
    member_count: 2,
  }));
  assert.deepEqual(
    homeGroups(groups).map((group) => group.id),
    ['third', 'first'],
  );
  assert.equal(groups.length, 3);
  assert.deepEqual(homeGroups([]), []);
});
test('greeting uses first name with whitespace and missing-name handling', () => {
  assert.equal(firstName(' Ramon Seugling '), 'Ramon');
  assert.equal(firstName('Ana'), 'Ana');
  assert.equal(firstName('   '), 'você');
});
