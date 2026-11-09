import assert from 'node:assert/strict';
import test from 'node:test';
import { dayOptions } from '../src/features/dates/editor-options.ts';

test('annual date selector retains February 29 and bounds each month', () => {
  assert.equal(dayOptions('2').at(-1)?.value, '29');
  assert.equal(dayOptions('4').at(-1)?.value, '30');
  assert.equal(dayOptions('1').at(-1)?.value, '31');
  for (const invalid of ['', '0', '13', '2.5', ' 2'])
    assert.deepEqual(dayOptions(invalid), []);
});

test('typed day accepts only valid digits for the selected month', async () => {
  const { clampDay, daysInMonth, sanitizeDay } =
    await import('../src/features/dates/editor-options.ts');
  assert.equal(daysInMonth('2'), 29);
  assert.equal(daysInMonth(''), 31);
  assert.equal(sanitizeDay('1a5', '1'), '15');
  assert.equal(sanitizeDay('0', '1'), '');
  assert.equal(sanitizeDay('45', '1'), '4');
  assert.equal(sanitizeDay('31', '4'), '3');
  assert.equal(sanitizeDay('30', '4'), '30');
  assert.equal(sanitizeDay('', '4'), '');
  assert.equal(clampDay('31', '4'), '30');
  assert.equal(clampDay('15', '4'), '15');
  assert.equal(clampDay('', '4'), '');
});
