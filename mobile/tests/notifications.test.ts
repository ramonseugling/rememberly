import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  foregroundPresentation,
  installationStorageKey,
  updateNotifications,
  type NotificationNative,
  type NotificationApi,
} from '../src/features/notifications/workflow.ts';

test('foreground reminders are visible only for the current authenticated session', () => {
  assert.deepEqual(foregroundPresentation('authenticated'), {
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  });
  for (const status of [
    'initializing',
    'anonymous',
    'authenticating',
    'unavailable',
  ]) {
    assert.deepEqual(foregroundPresentation(status), {
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  }
});

function fixture() {
  const calls: { path: string; body?: unknown }[] = [];
  let requests = 0;
  const native: NotificationNative = {
    unavailableReason: () => null,
    permission: async () => ({ granted: false, canAskAgain: true }),
    requestPermission: async () => {
      requests += 1;
      return { granted: true, canAskAgain: true };
    },
    installationId: async () => '3fbb616c-745b-455e-b5fc-1336ff5e2689',
    token: async () => 'ExponentPushToken[private-test-token]',
    platform: 'ios',
  };
  const api: NotificationApi = {
    async request<T>(
      path: string,
      options?: Parameters<NotificationApi['request']>[1],
    ) {
      calls.push({ path, body: options?.body });
      return undefined as T;
    },
  };
  const signal = new AbortController().signal;
  return { native, api, calls, signal, requests: () => requests };
}

test('explicit enable obtains permission and registers before enabling preference', async () => {
  const f = fixture();
  assert.equal(f.requests(), 0);
  const result = await updateNotifications(
    true,
    f.native,
    f.api,
    () => true,
    f.signal,
  );
  assert.equal(f.requests(), 1);
  assert.equal(result.kind, 'registered');
  assert.deepEqual(
    f.calls.map((call) => call.path),
    ['/api/v1/mobile/push-devices', '/api/v1/mobile/notification-preferences'],
  );
  assert.deepEqual(f.calls[1].body, { push_enabled: true });
  assert.ok(!JSON.stringify(result).includes('private-test-token'));
});

test('unsupported Expo Go or simulator never requests permissions or writes', async () => {
  const f = fixture();
  f.native.unavailableReason = () =>
    'A physical development build is required.';
  assert.equal(
    (await updateNotifications(true, f.native, f.api, () => true, f.signal))
      .kind,
    'unsupported',
  );
  assert.equal(f.requests(), 0);
  assert.equal(f.calls.length, 0);
});

test('denied permission avoids further prompts and account writes', async () => {
  const f = fixture();
  f.native.permission = async () => ({ granted: false, canAskAgain: false });
  assert.equal(
    (await updateNotifications(true, f.native, f.api, () => true, f.signal))
      .kind,
    'denied',
  );
  assert.equal(f.requests(), 0);
  assert.equal(f.calls.length, 0);
});

test('account switch during OS permission prevents registration', async () => {
  const f = fixture();
  let active = true;
  f.native.requestPermission = async () => {
    active = false;
    return { granted: true, canAskAgain: true };
  };
  assert.equal(
    (await updateNotifications(true, f.native, f.api, () => active, f.signal))
      .kind,
    'stale',
  );
  assert.equal(f.calls.length, 0);
});

test('unmount during token retrieval prevents registration', async () => {
  const f = fixture();
  const abort = new AbortController();
  f.native.token = async () => {
    abort.abort();
    return 'sensitive';
  };
  assert.equal(
    (await updateNotifications(true, f.native, f.api, () => true, abort.signal))
      .kind,
    'stale',
  );
  assert.equal(f.calls.length, 0);
});

test('offline registration failure never enables the preference', async () => {
  const f = fixture();
  f.api.request = async (path) => {
    f.calls.push({ path });
    throw new Error('offline');
  };
  await assert.rejects(
    updateNotifications(true, f.native, f.api, () => true, f.signal),
    /offline/,
  );
  assert.deepEqual(
    f.calls.map((call) => call.path),
    ['/api/v1/mobile/push-devices'],
  );
});

test('account switch after registration cannot enable the next account preference', async () => {
  const f = fixture();
  let active = true;
  f.api.request = async <T>(path: string) => {
    f.calls.push({ path });
    active = false;
    return undefined as T;
  };
  const result = await updateNotifications(
    true,
    f.native,
    f.api,
    () => active,
    f.signal,
  );
  assert.equal(result.kind, 'stale');
  assert.deepEqual(
    f.calls.map((call) => call.path),
    ['/api/v1/mobile/push-devices'],
  );
});

test('failure to save preference does not report successful registration', async () => {
  const f = fixture();
  f.api.request = async <T>(path: string) => {
    f.calls.push({ path });
    if (path.endsWith('notification-preferences')) throw new Error('offline');
    return undefined as T;
  };
  await assert.rejects(
    updateNotifications(true, f.native, f.api, () => true, f.signal),
    /offline/,
  );
  assert.equal(f.calls.length, 2);
});

test('disable stops account delivery before unregistering without permission prompt', async () => {
  const f = fixture();
  assert.equal(
    (await updateNotifications(false, f.native, f.api, () => true, f.signal))
      .kind,
    'disabled',
  );
  assert.deepEqual(f.calls[0].body, { push_enabled: false });
  assert.match(f.calls[1].path, /push-devices\/3fbb616c/);
  assert.equal(f.requests(), 0);
});

test('partial disable failure explains stopped delivery and retryable device cleanup', async () => {
  const f = fixture();
  f.native.installationId = async () => {
    throw new Error('storage');
  };
  await assert.rejects(
    updateNotifications(false, f.native, f.api, () => true, f.signal),
    /Push is disabled.*cleanup failed/,
  );
  assert.deepEqual(f.calls[0].body, { push_enabled: false });
});

test('installation keys isolate both API origin and environment', () => {
  const key = installationStorageKey('staging', 'https://a.example');
  assert.notEqual(
    key,
    installationStorageKey('production', 'https://a.example'),
  );
  assert.notEqual(key, installationStorageKey('staging', 'https://b.example'));
  assert.match(key, /^[\w.-]+$/);
});
