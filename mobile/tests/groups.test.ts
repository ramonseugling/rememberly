import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  birthdayLabel,
  canRemoveMember,
  groupNameError,
  inviteUrl,
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
    email: 'sam@example.com',
    role: 'member',
    birth_day: null,
    birth_month: null,
    daysUntil: null,
  };
  assert.equal(birthdayLabel(member), 'Birthday not shared');
  assert.equal(
    birthdayLabel({ ...member, birth_day: 29, birth_month: 2, daysUntil: 0 }),
    'February 29 · Today!',
  );
  assert.equal(
    birthdayLabel({ ...member, birth_day: 1, birth_month: 1, daysUntil: 1 }),
    'January 1 · Tomorrow',
  );
});
