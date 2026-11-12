import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../src/data/client.ts';
import {
  availabilityLabel,
  isWebLink,
  ownerFirstName,
  reserveActions,
  reserveError,
  reserveRequest,
} from '../src/features/gifts/member.ts';
import type { MemberGiftItem } from '../src/features/gifts/member.ts';

const base: MemberGiftItem = {
  id: 'i1',
  title: 'Fone',
  link: null,
  description: null,
  created_at: '',
  updated_at: '',
  availability: 'available',
  reserved_by_me: false,
};

test('offers the right actions for each state', () => {
  assert.deepEqual(reserveActions(base), ['reserve', 'purchase']);
  assert.deepEqual(
    reserveActions({ ...base, availability: 'reserved', reserved_by_me: true }),
    ['purchase', 'cancel'],
  );
  assert.deepEqual(
    reserveActions({
      ...base,
      availability: 'purchased',
      reserved_by_me: true,
    }),
    ['cancel'],
  );
  assert.deepEqual(reserveActions({ ...base, availability: 'reserved' }), []);
  assert.deepEqual(reserveActions({ ...base, availability: 'purchased' }), []);
});

test('labels availability without naming other people', () => {
  assert.equal(availabilityLabel(base), null);
  assert.equal(
    availabilityLabel({ ...base, availability: 'reserved' }),
    'Reservado',
  );
  assert.equal(
    availabilityLabel({
      ...base,
      availability: 'reserved',
      reserved_by_me: true,
    }),
    'Reservado por você',
  );
  assert.equal(
    availabilityLabel({ ...base, availability: 'purchased' }),
    'Comprado',
  );
  assert.equal(
    availabilityLabel({
      ...base,
      availability: 'purchased',
      reserved_by_me: true,
    }),
    'Você comprou',
  );
});

test('maps actions to API requests', () => {
  assert.deepEqual(reserveRequest('x', 'reserve'), {
    path: '/api/v1/gifts/x/reservation',
    method: 'PUT',
    body: { status: 'reserved' },
  });
  assert.equal(reserveRequest('x', 'purchase').body?.status, 'purchased');
  assert.equal(
    reserveRequest('x', 'reserve', 'Kq3vT9mXw2LpZr8YbN4cHg').body?.token,
    'Kq3vT9mXw2LpZr8YbN4cHg',
  );
  assert.equal(reserveRequest('x', 'reserve').body?.token, undefined);
  assert.deepEqual(reserveRequest('x', 'cancel'), {
    path: '/api/v1/gifts/x/reservation',
    method: 'DELETE',
  });
});

test('explains reservation failures in Portuguese', () => {
  assert.match(reserveError(new ApiError('http', 409, 'taken')), /reservar/);
  assert.match(reserveError(new ApiError('http', 404)), /não está mais/);
  assert.match(reserveError(new Error('x')), /Tente novamente/);
});

test('only opens http(s) links and shortens names', () => {
  assert.equal(isWebLink('https://x.com'), true);
  assert.equal(isWebLink('javascript:alert(1)'), false);
  assert.equal(isWebLink('intent://x'), false);
  assert.equal(ownerFirstName('  Ana Maria Souza '), 'Ana');
});
