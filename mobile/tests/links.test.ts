import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  IntentQueue,
  acceptNotificationId,
  intentPath,
  parseNativeLink,
  pendingPath,
  parseNotification,
  notificationPath,
  resourceId,
} from '../src/navigation/intents.ts';
const token = 'a'.repeat(96);
const id = 'deadbeef-1234-4234-8234-123456789abc';
test('supported exact links produce validated intents', () => {
  for (const origin of [
    'rememberly://',
    'rememberly://app/',
    'rememberly:///',
    'https://rememberly.com.br/',
    'https://www.rememberly.com.br/',
  ]) {
    assert.deepEqual(parseNativeLink(`${origin}join-group?code=abc12_-3`), {
      kind: 'invitation',
      code: 'abc12_-3',
    });
    assert.deepEqual(
      parseNativeLink(`${origin}reset-password?token=${token}`),
      { kind: 'reset', token },
    );
  }
  assert.equal(
    intentPath({ kind: 'invitation', code: 'abc12_-3' }),
    '/join-group?code=abc12_-3',
  );
  assert.equal(
    intentPath({ kind: 'reset', token }),
    `/reset-password?token=${token}`,
  );
});
test('rejects hostile hosts, redirects, duplicate and malformed parameters', () => {
  for (const input of [
    'https://evil.example/join-group?code=abc12_-3',
    'https://rememberly.com.br.evil.example/join-group?code=abc12_-3',
    'http://rememberly.com.br/join-group?code=abc12_-3',
    'https://user@rememberly.com.br/join-group?code=abc12_-3',
    'https://rememberly.com.br:444/join-group?code=abc12_-3',
    '//rememberly.com.br/join-group?code=abc12_-3',
    'rememberly://evil/join-group?code=abc12_-3',
    'rememberly://join-group?code=abc12_-3&code=abc12_-3',
    'rememberly://join-group?code=abc12_-3&next=/profile',
    'rememberly://join-group?code=abc12_-3#fragment',
    'rememberly://join-group?code=%61bc12_-3',
    'rememberly://join-group?code=abc12_-%',
    'rememberly://join-group?code=abc12_-3 ',
    'rememberly://join-group?code=ABC12_-3',
    'rememberly://join-group?code=short',
    `rememberly://join-group?code=${'a'.repeat(600)}`,
    'https://rememberly.com.br/ignored/../join-group?code=abc12_-3',
    `rememberly://reset-password?token=${'a'.repeat(95)}`,
    `rememberly://reset-password?token=${'g'.repeat(96)}`,
    'rememberly://profile?code=abc12_-3',
    'javascript:alert(1)',
  ])
    assert.equal(parseNativeLink(input), null, input);
});
test('development origin must be explicitly passed and exact', () => {
  const url = 'http://localhost:3000/join-group?code=abc12_-3';
  assert.equal(parseNativeLink(url), null);
  assert.equal(
    parseNativeLink(url, 'http://localhost:3000')?.kind,
    'invitation',
  );
  assert.equal(parseNativeLink(url, 'http://localhost:3001'), null);
});
test('notification destinations only use validated payload kinds and resources', () => {
  for (const [data, path] of [
    [{ kind: 'event', event_id: id }, '/(tabs)/events'],
    [{ kind: 'birthday', user_id: id }, `/(tabs)/birthday?userId=${id}`],
    [{ kind: 'commemorative', date_key: 'christmas' }, '/(tabs)/occasions'],
  ] as const) {
    const intent = parseNotification({ ...data, url: 'https://evil.example' });
    assert.ok(intent);
    assert.equal(notificationPath(intent), path);
  }
  for (const data of [
    null,
    [],
    'event',
    { url: 'https://evil.example' },
    { kind: 'event', event_id: '../profile' },
    { kind: 'birthday', user_id: [id] },
    { kind: 'commemorative', date_key: 'unknown' },
    { kind: 'commemorative', date_key: ['christmas'] },
  ])
    assert.equal(parseNotification(data), null);
  assert.equal(resourceId([id]), false);
});
test('signed-out intentions survive login once; account-bound work never crosses logout or switching', () => {
  const queue = new IntentQueue();
  const invitation = { kind: 'invitation', code: 'abc12_-3' } as const;
  queue.identity(null);
  queue.enqueue(invitation, null);
  queue.identity('alice');
  assert.deepEqual(queue.take('alice'), invitation);
  assert.equal(queue.take('alice'), null);
  queue.enqueue(invitation, 'alice');
  queue.identity('bob');
  assert.equal(queue.take('bob'), null);
  queue.enqueue(invitation, 'bob');
  queue.identity(null);
  queue.identity('bob');
  assert.equal(queue.take('bob'), null);
  queue.identity(null);
  queue.enqueue({ kind: 'notification', tab: 'dates' }, null);
  queue.identity('alice');
  assert.deepEqual(queue.take('alice'), { kind: 'notification', tab: 'dates' });
  queue.enqueue(invitation, null);
  queue.clear();
  assert.equal(queue.take('alice'), null);
});

test('notification deduplication retains only the latest 100 handled IDs', () => {
  const seen = new Set<string>();
  assert.equal(acceptNotificationId(seen, 'first'), true);
  assert.equal(acceptNotificationId(seen, 'first'), false);
  for (let index = 0; index < 100; index += 1)
    assert.equal(acceptNotificationId(seen, `notification-${index}`), true);
  assert.equal(seen.size, 100);
  assert.equal(seen.has('first'), false);
  assert.equal(acceptNotificationId(seen, 'notification-99'), false);
  assert.equal(acceptNotificationId(seen, 'first'), true);
  assert.equal(seen.size, 100);
  assert.equal(seen.has('notification-0'), false);
});

test('accepts gift list links for a valid user id only', () => {
  const id = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  const intent = { kind: 'gift-list', userId: id };
  assert.deepEqual(
    parseNativeLink(`rememberly://gift-list?user=${id}`),
    intent,
  );
  assert.deepEqual(
    parseNativeLink(`https://rememberly.com.br/gift-list?user=${id}`),
    intent,
  );
  assert.equal(intentPath(intent as never), `/gift-list?user=${id}`);
  for (const bad of [
    'rememberly://gift-list?user=abc',
    `rememberly://gift-list?code=${id}`,
    `rememberly://gift-list?user=${id}&x=1`,
    `https://evil.com/gift-list?user=${id}`,
    `rememberly://gift-list/extra?user=${id}`,
  ])
    assert.equal(parseNativeLink(bad), null, bad);
});

test('opens a pending gift list link on the member list after login', () => {
  const id = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  assert.equal(
    pendingPath({ kind: 'gift-list', userId: id }),
    `/(tabs)/gifts-member?userId=${id}`,
  );
  assert.equal(
    pendingPath({ kind: 'invitation', code: 'abc12_-3' }),
    '/join-group?code=abc12_-3',
  );
});
