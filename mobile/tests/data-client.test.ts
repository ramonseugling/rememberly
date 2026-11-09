import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError, createAuthenticatedTransport } from '../src/data/client.ts';
import type {
  SessionTransport,
  SessionApi,
  SessionIdentity,
} from '../src/session/api.ts';
import { SessionController } from '../src/session/controller.ts';

const origin = 'https://api.example.com';
const tokenA = 'a'.repeat(96);
const tokenB = 'b'.repeat(96);
const user: SessionIdentity = {
  user: { id: 'a', name: 'Alex', email: 'alex@example.com' },
  expires_at: null,
};
const other: SessionIdentity = {
  user: { id: 'b', name: 'Blair', email: 'blair@example.com' },
  expires_at: null,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function fixture(transport: SessionTransport) {
  const saved = { value: tokenA as string | null };
  const api: SessionApi = {
    login: async () => ({ ...other, token: tokenB, token_type: 'Bearer' }),
    inspect: async (token) => (token === tokenA ? user : other),
    revoke: async () => {},
  };
  const controller = new SessionController(
    api,
    {
      get: async () => saved.value,
      set: async (token) => {
        saved.value = token;
      },
      remove: async () => {
        saved.value = null;
      },
    },
    createAuthenticatedTransport(origin, transport),
  );
  return { controller, saved };
}

function response(url: string, status = 200, body: unknown = { ok: true }) {
  return { url, status, redirected: false, json: async () => body };
}

test('data requests use the exact trusted API origin and omit cookies/redirects without UI-visible tokens', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const { controller } = fixture(async (url, init) => {
    calls.push({ url, init });
    return response(url);
  });
  await controller.restore();
  const request = controller.request;
  assert.deepEqual(await request('/api/v1/me'), { ok: true });
  assert.equal(request, controller.request);
  assert.equal(calls[0].url, `${origin}/api/v1/me`);
  assert.equal(calls[0].init.credentials, 'omit');
  assert.equal(calls[0].init.redirect, 'error');
  assert.equal(
    new Headers(calls[0].init.headers).get('Authorization'),
    `Bearer ${tokenA}`,
  );
  assert.equal(new Headers(calls[0].init.headers).has('Cookie'), false);
  assert.equal('token' in controller.getSnapshot(), false);
});

test('rejects external, protocol-relative, non-API, fragment, backslash, and escaping paths before transport', async () => {
  let calls = 0;
  const { controller } = fixture(async (url) => {
    calls++;
    return response(url);
  });
  await controller.restore();
  for (const path of [
    'https://attacker.example/api/v1/me',
    '//attacker.example/api/v1/me',
    '/api/v1/../../../login',
    '/login',
    '/api/v1/me#token',
    '/api/v1/\\attacker.example',
  ])
    await assert.rejects(controller.request(path), ApiError);
  assert.equal(calls, 0);
});

test('passes JSON mutations and query parameters without allowing header overrides; 204 resolves null', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const { controller } = fixture(async (url, init) => {
    calls.push({ url, init });
    return response(url, 204);
  });
  await controller.restore();
  assert.equal(
    await controller.request('/api/v1/commemorative-dates/mothers_day', {
      method: 'DELETE',
    }),
    null,
  );
  assert.equal(
    await controller.request('/api/v1/users?source=mobile', {
      method: 'PATCH',
      body: { name: 'Alex' },
    }),
    null,
  );
  assert.equal(calls[1].init.body, JSON.stringify({ name: 'Alex' }));
  assert.equal(
    new Headers(calls[1].init.headers).get('Content-Type'),
    'application/json',
  );
  assert.equal(calls[1].url, `${origin}/api/v1/users?source=mobile`);
});

test('current-session 401 hides identity, clears secure storage, and blocks further data access', async () => {
  let calls = 0;
  const { controller, saved } = fixture(async (url) => {
    calls++;
    return response(url, 401);
  });
  await controller.restore();
  await assert.rejects(
    controller.request('/api/v1/me'),
    (error: unknown) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(controller.getSnapshot().status, 'signed-out');
  assert.equal(controller.getSnapshot().identity, null);
  assert.equal(saved.value, null);
  await assert.rejects(controller.request('/api/v1/me'), ApiError);
  assert.equal(calls, 1);
});

test('403, 404, and server/network failures do not destroy the active session or disclose remote details', async () => {
  for (const status of [403, 404, 429, 500, 503, 0]) {
    const { controller, saved } = fixture(async (url) => {
      if (status === 0) throw new Error('sensitive remote detail');
      return response(url, status);
    });
    await controller.restore();
    await assert.rejects(
      controller.request('/api/v1/me'),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === status &&
        !error.message.includes('sensitive'),
    );
    assert.equal(controller.getSnapshot().status, 'authenticated');
    assert.equal(saved.value, tokenA);
  }
});

test('late success after logout is rejected rather than publishing account data', async () => {
  const pending = deferred<ReturnType<typeof response>>();
  const { controller } = fixture(() => pending.promise);
  await controller.restore();
  const request = controller.request('/api/v1/me');
  await controller.logout();
  pending.resolve(response(`${origin}/api/v1/me`, 200, user));
  await assert.rejects(
    request,
    (error: unknown) => error instanceof ApiError && error.kind === 'stale',
  );
  assert.equal(controller.getSnapshot().identity, null);
});

test('late success from a previous account cannot be published after switching accounts', async () => {
  const pending = deferred<ReturnType<typeof response>>();
  const { controller, saved } = fixture(() => pending.promise);
  await controller.restore();
  const request = controller.request('/api/v1/me');
  await controller.login('blair@example.com', 'password');
  pending.resolve(response(`${origin}/api/v1/me`, 200, user));
  await assert.rejects(
    request,
    (error: unknown) => error instanceof ApiError && error.kind === 'stale',
  );
  assert.equal(saved.value, tokenB);
  assert.equal(controller.getSnapshot().identity?.user.id, 'b');
});

test('a late 401 from the previous account cannot clear or invalidate the new account', async () => {
  const pending = deferred<ReturnType<typeof response>>();
  const { controller, saved } = fixture(() => pending.promise);
  await controller.restore();
  const request = controller.request('/api/v1/me');
  await controller.login('blair@example.com', 'password');
  pending.resolve(response(`${origin}/api/v1/me`, 401));
  await assert.rejects(
    request,
    (error: unknown) => error instanceof ApiError && error.kind === 'stale',
  );
  assert.equal(controller.getSnapshot().status, 'authenticated');
  assert.equal(saved.value, tokenB);
});

test('rejected-session cleanup queued behind a login cannot remove its new credential', async () => {
  const pending = deferred<ReturnType<typeof response>>();
  const { controller, saved } = fixture(() => pending.promise);
  await controller.restore();
  const request = controller.request('/api/v1/me');
  const denied = assert.rejects(request, ApiError);
  pending.resolve(response(`${origin}/api/v1/me`, 401));
  await Promise.resolve();
  await controller.login('blair@example.com', 'password');
  await denied;
  assert.equal(controller.getSnapshot().status, 'authenticated');
  assert.equal(saved.value, tokenB);
});

test('a 401 still clearing storage becomes stale when a new login starts', async () => {
  const started = deferred<void>();
  const release = deferred<void>();
  let saved: string | null = tokenA;
  let removals = 0;
  const controller = new SessionController(
    {
      inspect: async () => user,
      login: async () => ({ ...other, token: tokenB, token_type: 'Bearer' }),
      revoke: async () => {},
    },
    {
      get: async () => saved,
      set: async (token) => {
        saved = token;
      },
      remove: async () => {
        if (++removals === 1) {
          started.resolve();
          await release.promise;
        }
        saved = null;
      },
    },
    createAuthenticatedTransport(origin, async (url) => response(url, 401)),
  );
  await controller.restore();
  const denied = assert.rejects(
    controller.request('/api/v1/me'),
    (error: unknown) => error instanceof ApiError && error.kind === 'stale',
  );
  await started.promise;
  const login = controller.login('blair@example.com', 'password');
  release.resolve();
  await Promise.all([denied, login]);
  assert.equal(controller.getSnapshot().identity?.user.id, 'b');
  assert.equal(saved, tokenB);
});

test('external abort reaches the transport and prevents a late response from being published', async () => {
  const pending = deferred<ReturnType<typeof response>>();
  let signal: AbortSignal | undefined;
  const { controller, saved } = fixture((_url, init) => {
    signal = init.signal ?? undefined;
    return pending.promise;
  });
  await controller.restore();
  const abort = new AbortController();
  const request = controller.request('/api/v1/me', { signal: abort.signal });
  abort.abort();
  assert.equal(signal?.aborted, true);
  pending.resolve(response(`${origin}/api/v1/me`));
  await assert.rejects(
    request,
    (error: unknown) => error instanceof ApiError && error.kind === 'cancelled',
  );
  assert.equal(saved.value, tokenA);
});

test('pre-aborted request never sends a credential and redirect responses are rejected', async () => {
  let calls = 0;
  const { controller } = fixture(async (url) => {
    calls++;
    return { ...response(url), redirected: true };
  });
  await controller.restore();
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(
    controller.request('/api/v1/me', { signal: abort.signal }),
    ApiError,
  );
  assert.equal(calls, 0);
  await assert.rejects(controller.request('/api/v1/me'), ApiError);
  assert.equal(calls, 1);
});

test('raw binary bodies keep their content type, never combine with JSON and never ride on GET', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const { controller } = fixture(async (url, init) => {
    calls.push({ url, init });
    return response(url, 200, { avatar_url: 'https://cdn.example.com/a.webp' });
  });
  await controller.restore();
  const data = new Uint8Array([1, 2, 3]);
  await controller.request('/api/v1/users/avatar', {
    method: 'PUT',
    rawBody: { data, contentType: 'image/jpeg' },
  });
  assert.equal(calls[0]!.init.body, data);
  const headers = new Headers(calls[0]!.init.headers);
  assert.equal(headers.get('Content-Type'), 'image/jpeg');
  assert.equal(headers.get('Authorization')?.startsWith('Bearer '), true);
  await assert.rejects(
    controller.request('/api/v1/users/avatar', {
      method: 'PUT',
      body: { a: 1 },
      rawBody: { data, contentType: 'image/jpeg' },
    }),
    (error) => error instanceof ApiError && error.kind === 'network',
  );
  await assert.rejects(
    controller.request('/api/v1/users/avatar', {
      rawBody: { data, contentType: 'image/jpeg' },
    }),
    (error) => error instanceof ApiError && error.kind === 'network',
  );
  assert.equal(calls.length, 1);
});
