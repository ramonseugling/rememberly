import assert from 'node:assert/strict';
import test from 'node:test';
import { groupColors } from '../src/features/groups/group-palette.ts';
import { memberSubtitle } from '../src/features/groups/member-subtitle.ts';
import {
  birthdayDateLabel,
  birthdaysInMonth,
} from '../src/features/groups/model.ts';
import type { GroupMember } from '../src/features/groups/model.ts';

const member = (overrides: Partial<GroupMember>): GroupMember => ({
  id: 'u1',
  name: 'Ana',
  email: 'ana@example.com',
  role: 'member',
  birth_day: 14,
  birth_month: 3,
  daysUntil: 126,
  ...overrides,
});

test('group colors are stable per group id and come from the palette', () => {
  assert.deepEqual(groupColors('abc'), groupColors('abc'));
  const colors = new Set(
    ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => groupColors(id).color),
  );
  assert.ok(colors.size > 1);
});

test('birthday date label uses the day and month without weekday', () => {
  assert.equal(birthdayDateLabel(member({})), '14 de março');
  assert.equal(
    birthdayDateLabel(member({ birth_day: null, birth_month: null })),
    'Aniversário não informado',
  );
});

test('month birthdays only include members born in the given month', () => {
  const list = [
    member({ id: 'a', birth_month: 11 }),
    member({ id: 'b', birth_month: 3 }),
    member({ id: 'c', birth_month: 11 }),
  ];
  assert.deepEqual(
    birthdaysInMonth(list, 11).map((entry) => entry.id),
    ['a', 'c'],
  );
});

test('member subtitle shows role, date and distance in days', () => {
  assert.equal(
    memberSubtitle(member({ role: 'owner' })),
    'Criador · 14 de março · Em 126 dias',
  );
  assert.equal(
    memberSubtitle(member({ birth_month: 11, birth_day: 8, daysUntil: 0 })),
    '8 de novembro · Hoje',
  );
  assert.equal(
    memberSubtitle(member({ isNextYear: true })),
    '14 de março · Ano que vem',
  );
});
