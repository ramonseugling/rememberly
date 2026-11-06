import assert from 'node:assert/strict';
import { test } from 'node:test';
import { otpCode } from '../src/features/auth/signup-presentation.ts';

test('six-box OTP input accepts pasted and autofilled digits with separators', () => {
  assert.equal(otpCode('123456'), '123456');
  assert.equal(otpCode('123 456'), '123456');
  assert.equal(otpCode('12-34-56'), '123456');
  assert.equal(otpCode('Código: 654321'), '654321');
  assert.equal(otpCode('1234567'), '123456');
});

test('six-box OTP input supports deleting digits and clearing the field', () => {
  assert.equal(otpCode('12345'), '12345');
  assert.equal(otpCode(''), '');
  assert.equal(otpCode('sem código'), '');
});
