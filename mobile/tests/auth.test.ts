import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createPublicAuthApi,
  emailError,
  passwordError,
  PublicAuthError,
  registrationError,
  registrationDetailsError,
} from '../src/features/auth/api.ts';
import type {
  PublicTransport,
  Registration,
} from '../src/features/auth/api.ts';

const input: Registration = {
  name: 'Sam',
  email: 'sam@example.com',
  password: 'safe-password',
  otp_code: '012345',
  birth_day: 29,
  birth_month: 2,
  birth_year: 2000,
  marketing_consent: false,
};
const response = (data: unknown, status = 200, url = '') => ({
  status,
  url,
  redirected: false,
  json: async () => data,
});

test('public auth operations use fixed endpoints with no credentials or redirects', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const transport: PublicTransport = async (url, init) => {
    calls.push({ url, init });
    return response(
      url.endsWith('/users') ? { id: 'created-user' } : { message: 'ok' },
    );
  };
  const api = createPublicAuthApi('https://api.example.com', transport);
  await api.sendCode(' SAM@example.com ');
  await api.register(input);
  assert.deepEqual(await api.forgotPassword('sam@example.com'), {
    googleOnly: false,
  });
  await api.resetPassword('private-token', 'new-password');
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      'https://api.example.com/api/v1/otp',
      'https://api.example.com/api/v1/users',
      'https://api.example.com/api/v1/password/forgot',
      'https://api.example.com/api/v1/password/reset',
    ],
  );
  for (const call of calls) {
    assert.equal(call.init.method, 'POST');
    assert.equal(call.init.credentials, 'omit');
    assert.equal(call.init.redirect, 'error');
    assert.equal(
      (call.init.headers as Record<string, string>).Authorization,
      undefined,
    );
    assert.equal(call.url.includes('private-token'), false);
  }
  assert.deepEqual(JSON.parse(calls[0].init.body as string), {
    email: 'sam@example.com',
  });
  assert.deepEqual(JSON.parse(calls[1].init.body as string), input);
  assert.deepEqual(JSON.parse(calls[3].init.body as string), {
    token: 'private-token',
    password: 'new-password',
  });
});

test('public client rejects untrusted origins and redirect response destinations', async () => {
  const transport: PublicTransport = async () => response({ message: 'ok' });
  for (const origin of [
    'http://api.example.com',
    'https://user:secret@api.example.com',
    'https://api.example.com/path',
    'https://api.example.com?secret=abc',
  ]) {
    assert.throws(() => createPublicAuthApi(origin, transport));
  }
  assert.doesNotThrow(() =>
    createPublicAuthApi('http://localhost:3000', transport, true),
  );
  for (const result of [
    { ...response({ message: 'ok' }), redirected: true },
    response({ message: 'ok' }, 200, 'https://attacker.example/'),
  ]) {
    const api = createPublicAuthApi(
      'https://api.example.com',
      async () => result,
    );
    await assert.rejects(api.sendCode('sam@example.com'), PublicAuthError);
  }
});

test('server errors, malformed data and transport errors never expose response details', async () => {
  for (const transport of [
    async () => response({ message: 'secret backend details' }, 400),
    async () => response({ message: 'secret backend details' }, 500),
    async () => response(null),
    async () => response({}),
    async () => {
      throw new Error('secret token or credential');
    },
  ]) {
    const api = createPublicAuthApi('https://api.example.com', transport);
    await assert.rejects(
      api.sendCode('sam@example.com'),
      (error) =>
        error instanceof PublicAuthError && !error.message.includes('secret'),
    );
  }
});

test('cancellation rejects before dispatch and ignores a late response', async () => {
  const abort = new AbortController();
  let dispatched = 0;
  const api = createPublicAuthApi('https://api.example.com', async () => {
    dispatched++;
    return response({ message: 'ok' });
  });
  abort.abort();
  await assert.rejects(api.sendCode('sam@example.com', abort.signal));
  assert.equal(dispatched, 0);
  const late = new AbortController();
  const lateApi = createPublicAuthApi('https://api.example.com', async () => {
    late.abort();
    return response({ message: 'ok' });
  });
  await assert.rejects(lateApi.sendCode('sam@example.com', late.signal));
});

test('password recovery recognizes Google-only accounts without copying server text', async () => {
  const api = createPublicAuthApi('https://api.example.com', async () =>
    response({ message: 'server-language', google_only: true }),
  );
  assert.deepEqual(await api.forgotPassword('sam@example.com'), {
    googleOnly: true,
  });
});

test('registration validates names, code, passwords and actual birth dates', () => {
  const today = new Date(2026, 10, 4);
  assert.equal(registrationError(input, input.password, today), null);
  assert.ok(registrationError({ ...input, name: 'A' }, input.password, today));
  assert.ok(
    registrationError({ ...input, otp_code: '12345x' }, input.password, today),
  );
  assert.ok(
    registrationError({ ...input, birth_year: 2001 }, input.password, today),
  );
  assert.ok(
    registrationError(
      { ...input, birth_day: 5, birth_month: 11, birth_year: 2026 },
      input.password,
      today,
    ),
  );
  assert.ok(
    registrationError({ ...input, birth_year: 1899 }, input.password, today),
  );
  assert.ok(
    registrationError({ ...input, birth_day: 1.5 }, input.password, today),
  );
  assert.equal(emailError(' SAM@example.com '), null);
  assert.ok(emailError('invalid'));
  assert.ok(passwordError('short', 'short'));
  assert.ok(passwordError('a'.repeat(73), 'a'.repeat(73)));
  assert.ok(passwordError('password1', 'password2'));
});

test('registration details are validated before requesting an email code', () => {
  const { otp_code: _code, ...details } = input;
  const today = new Date(2026, 10, 6);
  assert.equal(
    registrationDetailsError(details, details.password, today),
    null,
  );
  assert.ok(
    registrationDetailsError(
      { ...details, email: 'invalid' },
      details.password,
      today,
    ),
  );
  assert.ok(
    registrationDetailsError(
      { ...details, birth_year: 2001 },
      details.password,
      today,
    ),
  );
  assert.ok(
    registrationDetailsError({ ...details, password: 'short' }, 'short', today),
  );
  assert.ok(
    registrationError({ ...details, otp_code: '' }, details.password, today),
  );
});
