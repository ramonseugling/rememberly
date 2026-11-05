import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { googleLogin, googleReturnUrl } from '../src/features/auth/google.ts';
import type { SessionTransport } from '../src/session/api.ts';

const state = 'a'.repeat(64);
const verifier = 'b'.repeat(64);
const code = 'c'.repeat(64);
const created = {
  token: 'd'.repeat(96),
  token_type: 'Bearer',
  expires_at: null,
  user: { id: 'user-a', email: 'dev@example.test', name: 'Dev' },
};

function setup(
  returnUrl: string | null,
  type = 'success',
  transport?: SessionTransport,
) {
  const calls: { url: string; init: RequestInit }[] = [];
  let sequence = 0;
  const authorize = googleLogin(
    'https://api.example.test',
    transport ??
      (async (url, init) => {
        calls.push({ url, init });
        return {
          status: 201,
          url,
          redirected: false,
          json: async () => created,
        };
      }),
    {
      random: () => (sequence++ === 0 ? verifier : state),
      challenge: async (value) =>
        createHash('sha256').update(value).digest('base64url'),
      open: async (url, redirect) => {
        const start = new URL(url);
        assert.equal(start.origin, 'https://api.example.test');
        assert.equal(start.searchParams.get('state'), state);
        assert.equal(
          start.searchParams.get('code_challenge'),
          createHash('sha256').update(verifier).digest('base64url'),
        );
        assert.equal(start.href.includes(verifier), false);
        assert.equal(redirect, googleReturnUrl);
        return { type, ...(returnUrl ? { url: returnUrl } : {}) };
      },
    },
  );
  return { authorize, calls };
}

test('exchanges a validated browser return using PKCE and a cookie-free fixed-origin request', async () => {
  const { authorize, calls } = setup(
    `${googleReturnUrl}?state=${state}&code=${code}`,
  );
  assert.deepEqual(await authorize(), created);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    'https://api.example.test/api/v1/mobile/auth/google/exchange',
  );
  assert.equal(calls[0].init.credentials, 'omit');
  assert.equal(calls[0].init.redirect, 'error');
  assert.deepEqual(JSON.parse(calls[0].init.body as string), {
    code,
    state,
    code_verifier: verifier,
  });
});

test('browser cancellation and provider cancellation never issue an exchange', async () => {
  for (const item of [
    setup(null, 'cancel'),
    setup(null, 'dismiss'),
    setup(`${googleReturnUrl}?state=${state}&error=cancelled`),
  ]) {
    assert.equal(await item.authorize(), null);
    assert.equal(item.calls.length, 0);
  }
});

test('rejects wrong state, duplicate parameters, alternate destinations and injected credentials', async () => {
  for (const url of [
    `${googleReturnUrl}?state=${verifier}&code=${code}`,
    `${googleReturnUrl}?state=${state}&code=${code}&code=${code}`,
    `https://auth/google?state=${state}&code=${code}`,
    `rememberly://other/google?state=${state}&code=${code}`,
    `rememberly://user@auth/google?state=${state}&code=${code}`,
    `${googleReturnUrl}?state=${state}&code=${code}#token`,
    `${googleReturnUrl}?state=${state}&token=${created.token}`,
  ]) {
    const { authorize, calls } = setup(url);
    await assert.rejects(authorize);
    assert.equal(calls.length, 0);
  }
});

test('rejects redirects, unexpected HTTP statuses and malformed sessions', async () => {
  for (const response of [
    { status: 201, redirected: true, url: '' },
    { status: 201, redirected: false, url: 'https://other.test' },
    { status: 200, redirected: false, url: '' },
    { status: 401, redirected: false, url: '' },
    {
      status: 201,
      redirected: false,
      url: '',
      json: async () => ({ ...created, token: 'invalid' }),
    },
  ]) {
    const { authorize } = setup(
      `${googleReturnUrl}?state=${state}&code=${code}`,
      'success',
      async () => ({ json: async () => created, ...response }),
    );
    await assert.rejects(authorize);
  }
});
