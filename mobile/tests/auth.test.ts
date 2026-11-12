import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createPublicAuthApi,
  emailError,
  nameError,
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
  accepted_terms: true,
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

test('invite preview is a credential-free GET that returns only the group name', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const transport: PublicTransport = async (url, init) => {
    calls.push({ url, init });
    return response({ name: 'Família Silva' });
  };
  const api = createPublicAuthApi('https://api.example.com', transport);
  assert.deepEqual(await api.invitePreview('abc12345'), {
    name: 'Família Silva',
  });
  assert.equal(
    calls[0]!.url,
    'https://api.example.com/api/v1/groups/invite?code=abc12345',
  );
  assert.equal(calls[0]!.init.method, 'GET');
  assert.equal(calls[0]!.init.credentials, 'omit');
  assert.equal(calls[0]!.init.redirect, 'error');
  assert.equal(calls[0]!.init.body, undefined);
});

test('invite preview rejects unknown codes and malformed responses', async () => {
  const notFound = createPublicAuthApi('https://api.example.com', async () =>
    response({ name: 'NotFoundError' }, 404),
  );
  await assert.rejects(
    notFound.invitePreview('zzzzzzzz'),
    (error) => error instanceof PublicAuthError && error.status === 404,
  );
  const malformed = createPublicAuthApi('https://api.example.com', async () =>
    response({ title: 'x' }),
  );
  await assert.rejects(malformed.invitePreview('abc12345'), PublicAuthError);
});

test('explains known bad requests with app copy, never the raw server text', async () => {
  const cases: [string, RegExp][] = [
    ['Este e-mail já está em uso.', /já está associado a outra conta/],
    ['Código de verificação incorreto.', /código está incorreto/],
    [
      'Código de verificação inválido, expirado ou tentativas esgotadas.',
      /Solicite um novo código/,
    ],
  ];
  for (const [message, expected] of cases) {
    const api = createPublicAuthApi('https://api.example.com', async () =>
      response({ message, action: 'secret' }, 400),
    );
    await assert.rejects(
      api.sendCode('sam@example.com'),
      (error) =>
        error instanceof PublicAuthError &&
        expected.test(error.message) &&
        !error.message.includes('secret'),
    );
  }
});

test('registration refuses people younger than 12 and accepts exactly 12', () => {
  const { otp_code: _code, ...details } = input;
  const today = new Date(2026, 10, 6);
  const at = (birth_year: number, birth_month: number, birth_day: number) =>
    registrationDetailsError(
      { ...details, birth_year, birth_month, birth_day },
      details.password,
      today,
    );
  assert.equal(at(2014, 11, 6), null);
  assert.equal(
    at(2014, 11, 7),
    'É preciso ter 12 anos ou mais para criar uma conta.',
  );
  assert.equal(
    at(2020, 1, 1),
    'É preciso ter 12 anos ou mais para criar uma conta.',
  );
});

test('registration refuses an unchecked terms box and always posts accepted_terms true', async () => {
  const today = new Date(2026, 10, 6);
  const message =
    'Aceite os Termos de Uso e a Política de Privacidade para criar a conta.';
  assert.equal(
    registrationError(
      { ...input, accepted_terms: false },
      input.password,
      today,
    ),
    message,
  );
  const { otp_code: _code, ...details } = input;
  assert.equal(
    registrationDetailsError(
      { ...details, accepted_terms: false },
      details.password,
      today,
    ),
    message,
  );
  let body: Record<string, unknown> = {};
  const api = createPublicAuthApi(
    'https://api.example.com',
    async (_url, init) => {
      body = JSON.parse(init.body as string) as Record<string, unknown>;
      return response({ id: 'created-user' });
    },
  );
  await api.register({ ...input, accepted_terms: false });
  assert.equal(body.accepted_terms, true);
});

test('verifyCode posts to the fixed endpoint and returns only a well-formed token', async () => {
  const token = 'a'.repeat(64);
  const calls: { url: string; body: unknown }[] = [];
  const api = createPublicAuthApi(
    'https://api.example.com',
    async (url, init) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return response({ verification_token: token });
    },
  );

  assert.equal(await api.verifyCode(' SAM@example.com ', '123456'), token);
  assert.deepEqual(calls, [
    {
      url: 'https://api.example.com/api/v1/otp/verify',
      body: { email: 'sam@example.com', otp_code: '123456' },
    },
  ]);

  const broken = createPublicAuthApi('https://api.example.com', async () =>
    response({ verification_token: 'short' }),
  );
  await assert.rejects(broken.verifyCode('sam@example.com', '123456'));
});

test('register accepts a verification token instead of the code', async () => {
  const bodies: Record<string, unknown>[] = [];
  const api = createPublicAuthApi(
    'https://api.example.com',
    async (_url, init) => {
      bodies.push(JSON.parse(String(init.body)));
      return response({ id: 'created-user' });
    },
  );
  const { otp_code: _code, ...details } = input;

  await api.register({ ...details, verification_token: 'b'.repeat(64) });

  assert.equal(bodies[0]?.verification_token, 'b'.repeat(64));
  assert.equal('otp_code' in (bodies[0] ?? {}), false);
});

test('verifyResetCode posts to the fixed endpoint and returns only a well-formed token', async () => {
  const token = 'c'.repeat(96);
  const calls: { url: string; body: unknown }[] = [];
  const api = createPublicAuthApi(
    'https://api.example.com',
    async (url, init) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return response({ reset_token: token });
    },
  );

  assert.equal(await api.verifyResetCode(' SAM@example.com ', '123456'), token);
  assert.deepEqual(calls, [
    {
      url: 'https://api.example.com/api/v1/password/verify',
      body: { email: 'sam@example.com', otp_code: '123456' },
    },
  ]);

  const broken = createPublicAuthApi('https://api.example.com', async () =>
    response({ reset_token: 'short' }),
  );
  await assert.rejects(broken.verifyResetCode('sam@example.com', '123456'));
});

test('names need 2 to 60 letters and refuse digits and symbols', () => {
  assert.equal(nameError('Ana', 'nome'), null);
  assert.equal(nameError("D'Ávila-Souza", 'sobrenome'), null);
  assert.match(nameError('A', 'nome') ?? '', /2 a 60 caracteres/);
  assert.match(nameError('a'.repeat(61), 'nome') ?? '', /2 a 60 caracteres/);
  assert.match(nameError('Ana3', 'nome') ?? '', /apenas letras/);
  assert.match(nameError('@na', 'sobrenome') ?? '', /apenas letras/);
});
