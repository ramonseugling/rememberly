import assert from 'node:assert/strict';
import test from 'node:test';
import { groupSubtitle } from '../src/features/groups/group-subtitle.ts';
import type { Group } from '../src/features/groups/model.ts';

const base: Group = {
  id: 'g1',
  name: 'Família',
  invite_code: 'abcd1234',
  role: 'member',
  member_count: 8,
};

test('group subtitle shows member count and who created the group', () => {
  assert.equal(
    groupSubtitle({ ...base, created_by_name: 'Marina' }),
    '8 membros · Criado por Marina',
  );
  assert.equal(
    groupSubtitle({ ...base, role: 'owner', created_by_name: 'Ana' }),
    '8 membros · Criado por você',
  );
});

test('group subtitle falls back to the member count and handles a single member', () => {
  assert.equal(groupSubtitle(base), '8 membros');
  assert.equal(groupSubtitle({ ...base, member_count: 1 }), '1 membro');
});
