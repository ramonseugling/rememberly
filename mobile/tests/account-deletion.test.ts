import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canDeleteAccount,
  createDeletionConfirmation,
  deletionBody,
  deletionErrorMessage,
} from '../src/features/account/deletion-confirmation.ts';

test('account deletion requires a credential and the exact confirmation phrase', () => {
  const password = { mode: 'password', value: 'current password' } as const;
  const code = { mode: 'code', value: '482915' } as const;
  assert.equal(canDeleteAccount(password, 'Excluir minha conta'), true);
  assert.equal(canDeleteAccount(code, 'Excluir minha conta'), true);
  for (const confirmation of [
    '',
    'DELETE',
    'excluir minha conta',
    ' Excluir minha conta',
    'Excluir minha conta ',
  ]) {
    assert.equal(canDeleteAccount(password, confirmation), false);
  }
  assert.equal(
    canDeleteAccount({ mode: 'password', value: '' }, 'Excluir minha conta'),
    false,
  );
  for (const value of ['', '12345', '1234567', 'abcdef', '12 456']) {
    assert.equal(
      canDeleteAccount({ mode: 'code', value }, 'Excluir minha conta'),
      false,
    );
  }
});

test('the request body carries exactly one credential', () => {
  assert.deepEqual(deletionBody({ mode: 'password', value: 'secret' }), {
    password: 'secret',
    confirmation: 'Excluir minha conta',
  });
  assert.deepEqual(deletionBody({ mode: 'code', value: '482915' }), {
    otp_code: '482915',
    confirmation: 'Excluir minha conta',
  });
});

test('deletion errors are explained per cause', () => {
  assert.match(deletionErrorMessage(403, 'password'), /senha atual/);
  assert.match(deletionErrorMessage(409, 'password'), /grupos/);
  assert.match(deletionErrorMessage(400, 'code'), /Código inválido/);
  assert.match(deletionErrorMessage(429, 'code'), /Muitas tentativas/);
  assert.match(deletionErrorMessage(undefined, 'password'), /Tente novamente/);
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
