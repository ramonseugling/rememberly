import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  birthdayLabel,
  canRemoveMember,
  groupNameError,
  inviteUrl,
  daysLabel,
  orderedBirthdays,
  orderedMembers,
} from '../src/features/groups/model.ts';
import type { GroupMember } from '../src/features/groups/model.ts';

test('group names match the trimmed server limit', () => {
  assert.equal(groupNameError('  Family  '), null);
  assert.ok(groupNameError('   '));
  assert.equal(groupNameError(` ${'a'.repeat(100)} `), null);
  assert.ok(groupNameError('a'.repeat(101)));
});

test('member removal controls require ownership and exclude self and owner', () => {
  const member = { id: 'another-user', role: 'member' as const };
  assert.equal(canRemoveMember('owner', 'me', member), true);
  assert.equal(canRemoveMember('member', 'me', member), false);
  assert.equal(canRemoveMember('owner', 'me', { ...member, id: 'me' }), false);
  assert.equal(
    canRemoveMember('owner', 'me', { ...member, role: 'owner' }),
    false,
  );
});

test('invitation links encode the code without adding extra query values', () => {
  const link = new URL(
    inviteUrl('https://rememberly.example', 'abc&other=yes'),
  );
  assert.equal(link.origin, 'https://rememberly.example');
  assert.equal(link.pathname, '/join-group');
  assert.equal(link.searchParams.get('code'), 'abc&other=yes');
  assert.equal([...link.searchParams].length, 1);
});

test('birthday presentation handles absent dates, leap days, and today', () => {
  const member: GroupMember = {
    id: '1',
    name: 'Sam',
    role: 'member',
    birth_day: null,
    birth_month: null,
    daysUntil: null,
  };
  assert.equal(birthdayLabel(member), 'Aniversário não informado');
  assert.equal(
    birthdayLabel({ ...member, birth_day: 29, birth_month: 2, daysUntil: 0 }),
    '29 de fevereiro',
  );
  assert.equal(
    birthdayLabel({ ...member, birth_day: 1, birth_month: 1, daysUntil: 1 }),
    '1 de janeiro',
  );
});

test('group birthday badges match the web thresholds', () => {
  assert.deepEqual([0, 1, 7, 8, 14, 29, 30, 60].map(daysLabel), [
    'Hoje! 🎉',
    'Amanhã',
    'Em 7 dias',
    'Em 1 semana',
    'Em 2 semanas',
    'Em 4 semanas',
    'Em 1 mês',
    'Em 2 meses',
  ]);
});

test('group dates sort shared birthdays and omit missing dates without mutating member order', () => {
  const base: GroupMember = {
    id: 'a',
    name: 'A',
    role: 'member',
    birth_day: 15,
    birth_month: 12,
    daysUntil: 30,
  };
  const members = [
    base,
    { ...base, id: 'b', daysUntil: 0 },
    { ...base, id: 'c', birth_day: null, daysUntil: null },
  ];
  assert.deepEqual(
    orderedBirthdays(members).map((member) => member.id),
    ['b', 'a'],
  );
  assert.deepEqual(
    members.map((member) => member.id),
    ['a', 'b', 'c'],
  );
  assert.deepEqual(
    orderedMembers([members[2]!, members[0]!, members[1]!]).map(
      (member) => member.id,
    ),
    ['b', 'a', 'c'],
  );
  assert.equal(
    birthdayLabel({ ...base, weekday: 'terça-feira' }),
    '15 de dezembro (terça-feira)',
  );
});
