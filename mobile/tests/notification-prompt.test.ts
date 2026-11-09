import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PROMPT_COOLDOWN_MS,
  parseDismissedAt,
  promptStorageKey,
  shouldPrompt,
} from '../src/features/notifications/prompt-rules.ts';

const base = { pushEnabled: false, unavailable: false, now: 1_000_000_000 };

test('prompt appears when push is off, available and never dismissed', () => {
  assert.equal(shouldPrompt({ ...base, dismissedAt: null }), true);
});

test('prompt never appears when push is already on or unavailable on this device', () => {
  assert.equal(
    shouldPrompt({ ...base, pushEnabled: true, dismissedAt: null }),
    false,
  );
  assert.equal(
    shouldPrompt({ ...base, unavailable: true, dismissedAt: null }),
    false,
  );
});

test('after Agora não the prompt waits a week before reappearing', () => {
  const dismissedAt = base.now - (PROMPT_COOLDOWN_MS - 1);
  assert.equal(shouldPrompt({ ...base, dismissedAt }), false);
  assert.equal(
    shouldPrompt({ ...base, dismissedAt: base.now - PROMPT_COOLDOWN_MS }),
    true,
  );
});

test('stored dismissal is parsed defensively and keys are scoped per user and origin', () => {
  assert.equal(parseDismissedAt(null), null);
  assert.equal(parseDismissedAt('abc'), null);
  assert.equal(parseDismissedAt('-5'), null);
  assert.equal(parseDismissedAt('1700000000000'), 1700000000000);
  const a = promptStorageKey('staging', 'https://a.example', 'u1');
  assert.notEqual(a, promptStorageKey('staging', 'https://a.example', 'u2'));
  assert.notEqual(a, promptStorageKey('staging', 'https://b.example', 'u1'));
  assert.match(a, /^rememberly\.notification-prompt\./);
});
