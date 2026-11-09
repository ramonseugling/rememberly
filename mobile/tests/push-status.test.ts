import assert from 'node:assert/strict';
import test from 'node:test';
import {
  pushStatus,
  pushStatusCopy,
} from '../src/features/notifications/push-status.ts';

const granted = { granted: true, canAskAgain: true };
const askable = { granted: false, canAskAgain: true };
const blocked = { granted: false, canAskAgain: false };

test('push status reflects the account setting and the system permission', () => {
  const base = { unsupported: false };
  assert.equal(
    pushStatus({ ...base, pushEnabled: true, permission: granted }),
    'on',
  );
  assert.equal(
    pushStatus({ ...base, pushEnabled: false, permission: askable }),
    'off',
  );
  assert.equal(
    pushStatus({ ...base, pushEnabled: true, permission: blocked }),
    'denied',
  );
  assert.equal(
    pushStatus({ ...base, pushEnabled: false, permission: blocked }),
    'denied',
  );
  assert.equal(
    pushStatus({ ...base, pushEnabled: true, permission: null }),
    'on',
  );
});

test('unsupported environments always report unsupported', () => {
  assert.equal(
    pushStatus({ unsupported: true, pushEnabled: true, permission: granted }),
    'unsupported',
  );
});

test('each push status has its own title and guidance', () => {
  assert.equal(pushStatusCopy('on').title, 'Push neste aparelho');
  assert.match(pushStatusCopy('off').description, /Ative/);
  assert.match(pushStatusCopy('denied').description, /configurações/);
  assert.match(pushStatusCopy('unsupported').title, /indisponível/);
});
