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
