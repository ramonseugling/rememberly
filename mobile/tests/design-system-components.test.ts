import assert from 'node:assert/strict';
import test from 'node:test';
import { initialOf } from '../src/design-system/avatar/initial.ts';
import { daysBadge } from '../src/design-system/badge/days.ts';

test('avatar initial uses the first letter, uppercase, and handles empty names', () => {
  assert.equal(initialOf('  ana'), 'A');
  assert.equal(initialOf('édson'), 'É');
  assert.equal(initialOf('😀 Party'), '😀');
  assert.equal(initialOf('   '), '?');
});

test('days badge picks tone and Portuguese label by distance to the event', () => {
  assert.deepEqual(daysBadge(0, '15 dez'), { label: 'Hoje', tone: 'today' });
  assert.deepEqual(daysBadge(1, '15 dez'), { label: 'Em 1 dia', tone: 'soon' });
  assert.deepEqual(daysBadge(7, '15 dez'), {
    label: 'Em 7 dias',
    tone: 'soon',
  });
  assert.deepEqual(daysBadge(8, '15 dez'), {
    label: '15 dez',
    tone: 'neutral',
  });
  assert.deepEqual(daysBadge(12), { label: 'Em 12 dias', tone: 'neutral' });
});

test('events whose date already passed this year are labeled for next year', () => {
  assert.deepEqual(daysBadge(200, '05 mar', true), {
    label: 'Ano que vem',
    tone: 'neutral',
  });
  assert.deepEqual(daysBadge(3, undefined, true), {
    label: 'Ano que vem',
    tone: 'neutral',
  });
  assert.equal(daysBadge(3, undefined, false).label, 'Em 3 dias');
});
