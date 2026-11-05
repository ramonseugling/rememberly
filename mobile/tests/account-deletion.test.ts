import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canDeleteAccount,
  createDeletionConfirmation,
} from '../src/features/account/deletion-confirmation.ts';

test('account deletion requires a password and the exact destructive confirmation', () => {
  assert.equal(canDeleteAccount('current password', 'DELETE'), true);
  for (const confirmation of ['', 'delete', 'Delete', ' DELETE', 'DELETE ']) {
    assert.equal(canDeleteAccount('current password', confirmation), false);
  }
  assert.equal(canDeleteAccount('', 'DELETE'), false);
});

test('native confirmation authorizes only one submission for its original session', () => {
  const gate = createDeletionConfirmation<object>();
  const originalSession = {};
  const replacementSession = {};
  const ticket = gate.open(originalSession)!;
  assert.equal(gate.open(originalSession), null);
  assert.equal(gate.submit(ticket, replacementSession), false);
  assert.equal(gate.submit(ticket, originalSession), true);
  assert.equal(gate.submit(ticket, originalSession), false);
  // A native dismissal after pressing Delete cannot release an in-flight operation.
  assert.equal(gate.cancel(ticket), false);
  assert.equal(gate.open(originalSession), null);
  assert.equal(gate.current(ticket, replacementSession), false);
});

test('cancelled alerts and screen blur cannot submit later, even for the same account', () => {
  const gate = createDeletionConfirmation<object>();
  const session = {};
  const cancelled = gate.open(session)!;
  assert.equal(gate.cancel(cancelled), true);
  assert.equal(gate.submit(cancelled, session), false);
  const blurred = gate.open(session)!;
  gate.invalidate();
  const replacement = gate.open(session)!;
  assert.equal(gate.submit(blurred, session), false);
  assert.equal(gate.cancel(blurred), false);
  assert.equal(gate.current(blurred, session), false);
  assert.equal(gate.submit(replacement, session), true);
});

test('an old completion cannot match a newer deletion attempt', () => {
  const gate = createDeletionConfirmation<object>();
  const session = {};
  const first = gate.open(session)!;
  assert.equal(gate.submit(first, session), true);
  gate.invalidate();
  const second = gate.open(session)!;
  assert.equal(gate.current(first, session), false);
  assert.equal(gate.current(second, session), true);
});
