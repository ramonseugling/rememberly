import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RESEND_SECONDS,
  resendLabel,
} from '../src/features/auth/resend-cooldown.ts';

test('resend waits 60 seconds and shows the remaining time', () => {
  assert.equal(RESEND_SECONDS, 60);
  assert.equal(resendLabel(42), 'Reenviar em 42s');
  assert.equal(resendLabel(0), 'Reenviar');
});
