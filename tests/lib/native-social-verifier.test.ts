import { socialKeys } from 'tests/lib/native-social-fixtures';
import {
  NativeSocialAuthError,
  configuredAudiences,
  verifyNativeIdentityToken,
} from 'models/native-social-auth-verifier';

let keys: Awaited<ReturnType<typeof socialKeys>>;
const environment = {
  google: process.env.GOOGLE_NATIVE_CLIENT_IDS,
  apple: process.env.APPLE_NATIVE_CLIENT_IDS,
};
beforeAll(async () => {
  process.env.GOOGLE_NATIVE_CLIENT_IDS = 'native-fixture-client';
  process.env.APPLE_NATIVE_CLIENT_IDS = 'native-fixture-client';
  keys = await socialKeys();
});
afterAll(() => {
  for (const [name, value] of [
    ['GOOGLE_NATIVE_CLIENT_IDS', environment.google],
    ['APPLE_NATIVE_CLIENT_IDS', environment.apple],
  ]) {
    if (value === undefined) delete process.env[name!];
    else process.env[name!] = value;
  }
});

test.each(['google', 'apple'] as const)(
  'verifies signed %s issuer, audience and verified email',
  async (provider) => {
    const token = await keys.sign('nonce', {}, provider);
    await expect(
      verifyNativeIdentityToken(provider, token, keys.resolver),
    ).resolves.toMatchObject({
      subject: 'ephemeral-test-subject',
      email: 'social-fixture@example.test',
      nonce: 'nonce',
    });
  },
);

test.each([
  { iss: 'https://attacker.example' },
  { aud: 'wrong-client' },
  { exp: 1 },
  { iat: 9999999999 },
  { iat: 1 },
  { sub: '' },
  { sub: undefined },
  { exp: undefined },
  { nonce: undefined },
  { nonce: 123 },
  { email_verified: false },
  { email_verified: 'true' },
  { email: undefined },
  { email: 'invalid' },
  { azp: 'wrong-client' },
  { aud: ['native-fixture-client', 'wrong-client'] },
])('rejects invalid signed claims %j', async (claims) => {
  const token = await keys.sign('nonce', claims);
  await expect(
    verifyNativeIdentityToken('google', token, keys.resolver),
  ).rejects.toMatchObject({ code: 'invalid' });
});

test('rejects a token signed by another key and a tampered payload', async () => {
  const other = await socialKeys();
  await expect(
    verifyNativeIdentityToken(
      'google',
      await other.sign('nonce'),
      keys.resolver,
    ),
  ).rejects.toMatchObject({ code: 'invalid' });
  const token = await keys.sign('nonce');
  const parts = token.split('.');
  parts[1] = Buffer.from(JSON.stringify({ sub: 'attacker' })).toString(
    'base64url',
  );
  await expect(
    verifyNativeIdentityToken('google', parts.join('.'), keys.resolver),
  ).rejects.toMatchObject({ code: 'invalid' });
});

test('Apple accepts its string verified claim and later tokens without email; Google does not', async () => {
  await expect(
    verifyNativeIdentityToken(
      'apple',
      await keys.sign('nonce', { email_verified: 'true' }, 'apple'),
      keys.resolver,
    ),
  ).resolves.toMatchObject({ email: 'social-fixture@example.test' });
  await expect(
    verifyNativeIdentityToken(
      'apple',
      await keys.sign(
        'nonce',
        { email: undefined, email_verified: undefined },
        'apple',
      ),
      keys.resolver,
    ),
  ).resolves.toMatchObject({ email: null });
});

test('missing/invalid audience configuration fails closed without a web client fallback', () => {
  delete process.env.GOOGLE_NATIVE_CLIENT_IDS;
  expect(() => configuredAudiences('google')).toThrow(NativeSocialAuthError);
  for (const value of ['', '*', 'client,', 'client with space']) {
    process.env.GOOGLE_NATIVE_CLIENT_IDS = value;
    expect(() => configuredAudiences('google')).toThrow(NativeSocialAuthError);
  }
  process.env.GOOGLE_NATIVE_CLIENT_IDS = 'native-fixture-client';
});
