import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionApi, SessionApiError } from '../src/session/api.ts';
import type { SessionApi, SessionIdentity } from '../src/session/api.ts';
import { SessionController } from '../src/session/controller.ts';
import type { CredentialStorage } from '../src/session/controller.ts';

const tokenA = 'a'.repeat(96);
const tokenB = 'b'.repeat(96);
const current: SessionIdentity = {
  user: { id: 'user-a', name: 'Alex', email: 'alex@example.com' },
  expires_at: null,
};
const created = (token = tokenA) => ({
  ...current,
  token,
  token_type: 'Bearer' as const,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function memory(initial: string | null = null) {
  const state = { value: initial };
  const storage: CredentialStorage = {
    get: async () => state.value,
    set: async (token) => {
      state.value = token;
    },
    remove: async () => {
      state.value = null;
    },
  };
  return { state, storage };
}

function api(overrides: Partial<SessionApi> = {}): SessionApi {
  return {
    login: async () => created(),
    inspect: async () => current,
    revoke: async () => {},
    ...overrides,
  };
}

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

test('login persists only the token and restoration verifies it before exposing identity', async () => {
  const { storage, state } = memory();
  const controller = new SessionController(api(), storage);
  await controller.login('alex@example.com', 'password');
  assert.equal(state.value, tokenA);
  assert.deepEqual(controller.getSnapshot().identity, current);
  assert.equal('token' in controller.getSnapshot(), false);
  const check = deferred<SessionIdentity>();
  const reopened = new SessionController(
    api({ inspect: () => check.promise }),
    storage,
  );
  const restoring = reopened.restore();
  await tick();
  assert.equal(reopened.getSnapshot().status, 'restoring');
  assert.equal(reopened.getSnapshot().identity, null);
  check.resolve(current);
  await restoring;
  assert.equal(reopened.getSnapshot().status, 'authenticated');
});

test('foreground revalidation preserves the current identity while pending and during outages, then clears it on 401', async () => {
  const { storage, state } = memory(tokenA);
  let check = deferred<SessionIdentity>();
  const controller = new SessionController(
    api({ inspect: () => check.promise }),
    storage,
  );
  await controller.login('alex@example.com', 'password');
  const activeIdentity = controller.getSnapshot().identity;
  const pending = controller.restore();
  await tick();
  assert.equal(controller.getSnapshot().status, 'authenticated');
  assert.equal(controller.getSnapshot().identity, activeIdentity);
  check.reject(new SessionApiError(503));
  await pending;
  assert.equal(controller.getSnapshot().status, 'authenticated');
  assert.equal(controller.getSnapshot().identity, activeIdentity);
  assert.match(controller.getSnapshot().message ?? '', /recheck/);
  assert.equal(state.value, tokenA);
  check = deferred<SessionIdentity>();
  const rejected = controller.restore();
  await tick();
  check.reject(new SessionApiError(401));
  await rejected;
  assert.equal(controller.getSnapshot().status, 'signed-out');
  assert.equal(controller.getSnapshot().identity, null);
  assert.equal(state.value, null);
});

test('restoration keeps saved credentials on network and server failure, then retries', async () => {
  for (const status of [0, 500, 503]) {
    const { storage, state } = memory(tokenA);
    let unavailable = true;
    const controller = new SessionController(
      api({
        inspect: async () => {
          if (unavailable) throw new SessionApiError(status);
          return current;
        },
      }),
      storage,
    );
    await controller.restore();
    assert.equal(controller.getSnapshot().status, 'unavailable');
    assert.equal(controller.getSnapshot().identity, null);
    assert.equal(state.value, tokenA);
    unavailable = false;
    await controller.restore();
    assert.equal(controller.getSnapshot().status, 'authenticated');
  }
});

test('restoration removes rejected and malformed credentials', async () => {
  for (const saved of [tokenA, 'malformed']) {
    const { storage, state } = memory(saved);
    const controller = new SessionController(
      api({
        inspect: async () => {
          throw new SessionApiError(401);
        },
      }),
      storage,
    );
    await controller.restore();
    assert.equal(controller.getSnapshot().status, 'signed-out');
    assert.equal(state.value, null);
    assert.equal(controller.getSnapshot().identity, null);
  }
});

test('invalid login and outages remain distinct without persisting credentials', async () => {
  for (const status of [400, 401, 429, 500]) {
    const { storage, state } = memory();
    const controller = new SessionController(
      api({
        login: async () => {
          throw new SessionApiError(status);
        },
      }),
      storage,
    );
    await controller.login('alex@example.com', 'password');
    assert.equal(state.value, null);
    assert.equal(controller.getSnapshot().status, 'signed-out');
    assert.match(
      controller.getSnapshot().message ?? '',
      status === 400
        ? /valid email address/
        : status === 401
          ? /Invalid email/
          : status === 429
            ? /Too many sign-in attempts/
            : /unavailable/,
    );
  }
});

test('logout immediately hides identity and clears storage before awaiting revocation', async () => {
  const { storage, state } = memory(tokenA);
  const revoke = deferred<void>();
  const controller = new SessionController(
    api({ revoke: () => revoke.promise }),
    storage,
  );
  await controller.restore();
  const pending = controller.logout();
  assert.equal(controller.getSnapshot().identity, null);
  await tick();
  assert.equal(state.value, null);
  revoke.resolve();
  await pending;
  assert.equal(controller.getSnapshot().logoutUnconfirmed, false);
});

test('failed logout reports unconfirmed revocation and can retry without ordinary persistence', async () => {
  const { storage, state } = memory(tokenA);
  let disconnected = true;
  const controller = new SessionController(
    api({
      revoke: async (token) => {
        assert.equal(token, tokenA);
        if (disconnected) throw new SessionApiError(0);
      },
    }),
    storage,
  );
  await controller.restore();
  await controller.logout();
  assert.equal(state.value, null);
  assert.equal(controller.getSnapshot().logoutUnconfirmed, true);
  disconnected = false;
  await controller.logout();
  assert.equal(controller.getSnapshot().logoutUnconfirmed, false);
});

test('logout during initial storage restoration captures and revokes the stored token', async () => {
  const { storage, state } = memory(tokenA);
  const read = deferred<string | null>();
  let reads = 0;
  const revoked: string[] = [];
  const controller = new SessionController(
    api({
      revoke: async (token) => {
        revoked.push(token);
      },
    }),
    {
      ...storage,
      get: () => (++reads === 1 ? read.promise : storage.get()),
    },
  );
  const restoring = controller.restore();
  await tick();
  const loggingOut = controller.logout();
  read.resolve(tokenA);
  await Promise.all([restoring, loggingOut]);
  assert.equal(state.value, null);
  assert.deepEqual(revoked, [tokenA]);
  assert.equal(controller.getSnapshot().status, 'signed-out');
});

test('a failed account-switch login cannot restore the previous account later', async () => {
  const { storage, state } = memory(tokenA);
  const revoked: string[] = [];
  const controller = new SessionController(
    api({
      login: async () => {
        throw new SessionApiError(401);
      },
      revoke: async (token) => {
        revoked.push(token);
      },
    }),
    storage,
  );
  await controller.restore();
  await controller.login('other@example.com', 'wrong');
  assert.equal(state.value, null);
  assert.deepEqual(revoked, [tokenA]);
  const reopened = new SessionController(api(), storage);
  await reopened.restore();
  assert.equal(reopened.getSnapshot().status, 'signed-out');
});

test('late login and restore results cannot sign back in after logout', async () => {
  const { storage, state } = memory();
  const result = deferred<ReturnType<typeof created>>();
  const revoked: string[] = [];
  const controller = new SessionController(
    api({
      login: () => result.promise,
      revoke: async (token) => {
        revoked.push(token);
      },
    }),
    storage,
  );
  const signingIn = controller.login('alex@example.com', 'password');
  await tick();
  await controller.logout();
  result.resolve(created());
  await signingIn;
  assert.equal(controller.getSnapshot().status, 'signed-out');
  assert.equal(state.value, null);
  assert.deepEqual(revoked, [tokenA]);

  const late = deferred<SessionIdentity>();
  const restore = new SessionController(
    api({ inspect: () => late.promise }),
    memory(tokenB).storage,
  );
  const pending = restore.restore();
  await tick();
  await restore.logout();
  late.resolve(current);
  await pending;
  assert.equal(restore.getSnapshot().status, 'signed-out');
});

test('a slow secure write cannot survive logout or delete a newer account credential', async () => {
  const { storage, state } = memory();
  const write = deferred<void>();
  let writes = 0;
  let logins = 0;
  const controller = new SessionController(
    api({ login: async () => created(++logins === 1 ? tokenA : tokenB) }),
    {
      ...storage,
      set: async (token) => {
        if (++writes === 1) await write.promise;
        await storage.set(token);
      },
    },
  );
  const first = controller.login('alex@example.com', 'password');
  await tick();
  const logout = controller.logout();
  const second = controller.login('other@example.com', 'password');
  write.resolve();
  await Promise.all([first, logout, second]);
  assert.equal(state.value, tokenB);
  assert.equal(controller.getSnapshot().status, 'authenticated');
});

test('secure-storage write failure denies access and revokes the issued session', async () => {
  const { storage } = memory();
  const revoked: string[] = [];
  const controller = new SessionController(
    api({
      revoke: async (token) => {
        revoked.push(token);
      },
    }),
    {
      ...storage,
      set: async () => {
        throw new Error('storage unavailable');
      },
    },
  );
  await controller.login('alex@example.com', 'password');
  assert.equal(controller.getSnapshot().status, 'signed-out');
  assert.equal(controller.getSnapshot().identity, null);
  assert.deepEqual(revoked, [tokenA]);
});

test('secure-storage deletion failure is not reported as successful local logout', async () => {
  const { storage } = memory(tokenA);
  const controller = new SessionController(api(), {
    ...storage,
    remove: async () => {
      throw new Error('storage unavailable');
    },
  });
  await controller.restore();
  await controller.logout();
  assert.equal(controller.getSnapshot().logoutUnconfirmed, true);
  assert.match(controller.getSnapshot().message ?? '', /could not be removed/);
});

test('HTTP client sends credentials only to its fixed origin with cookies and redirects disabled', async () => {
  const requests: { url: string; init: RequestInit }[] = [];
  const client = createSessionApi(
    'https://api.example.com',
    async (url, init) => {
      requests.push({ url, init });
      return {
        status:
          init.method === 'POST' ? 201 : init.method === 'DELETE' ? 204 : 200,
        url,
        redirected: false,
        json: async () => (init.method === 'POST' ? created() : current),
      };
    },
  );
  await client.login('alex@example.com', 'password');
  await client.inspect(tokenA);
  await client.revoke(tokenA);
  for (const { url, init } of requests) {
    assert.equal(url, 'https://api.example.com/api/v1/mobile/sessions');
    assert.equal(init.credentials, 'omit');
    assert.equal(init.redirect, 'error');
    assert.equal(new Headers(init.headers).has('Cookie'), false);
  }
  assert.equal(
    new Headers(requests[0].init.headers).has('Authorization'),
    false,
  );
  assert.equal(
    new Headers(requests[1].init.headers).get('Authorization'),
    `Bearer ${tokenA}`,
  );
  assert.throws(() =>
    createSessionApi('https://attacker.example/path', async () => {
      throw new Error();
    }),
  );
});

test('HTTP client rejects redirects and unexpected success statuses without claiming revocation', async () => {
  for (const response of [
    { status: 200, url: 'https://attacker.example', redirected: true },
    {
      status: 200,
      url: 'https://api.example.com/api/v1/mobile/sessions',
      redirected: false,
    },
  ]) {
    const client = createSessionApi('https://api.example.com', async () => ({
      ...response,
      json: async () => current,
    }));
    await assert.rejects(client.revoke(tokenA), SessionApiError);
  }
});

test('HTTP client sanitizes network/server errors and rejects malformed identity/token responses', async () => {
  const outage = createSessionApi('https://api.example.com', async () => {
    throw new Error('credential-bearing network detail');
  });
  await assert.rejects(
    outage.inspect(tokenA),
    (error: unknown) =>
      error instanceof SessionApiError &&
      !error.message.includes('credential-bearing'),
  );
  for (const body of [
    {},
    { ...created(), token: 'invalid' },
    { ...created(), expires_at: 'invalid-date' },
  ]) {
    const client = createSessionApi('https://api.example.com', async (url) => ({
      status: 201,
      url,
      redirected: false,
      json: async () => body,
    }));
    await assert.rejects(
      client.login('alex@example.com', 'password'),
      SessionApiError,
    );
  }
});
