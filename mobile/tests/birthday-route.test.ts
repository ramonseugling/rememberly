import assert from 'node:assert/strict';
import test from 'node:test';
import {
  birthdayRoute,
  originPath,
  parseOrigin,
} from '../src/features/gifts/birthday-route.ts';

test('parseOrigin only accepts known origins and defaults to home', () => {
  assert.equal(parseOrigin('events'), 'events');
  assert.equal(parseOrigin(['groups', 'events']), 'groups');
  assert.equal(parseOrigin('home'), 'home');
  assert.equal(parseOrigin('unknown'), 'home');
  assert.equal(parseOrigin(undefined), 'home');
});

test('the back path of every origin is a fixed tab, never the previous history entry', () => {
  assert.equal(originPath('home'), '/(tabs)');
  assert.equal(originPath('events'), '/(tabs)/events');
  assert.equal(originPath('groups'), '/(tabs)/groups');
});

test('birthdayRoute carries the origin so the way back survives the member list', () => {
  assert.deepEqual(birthdayRoute('user-1', 'events'), {
    pathname: '/(tabs)/birthday',
    params: { userId: 'user-1', from: 'events' },
  });
});
