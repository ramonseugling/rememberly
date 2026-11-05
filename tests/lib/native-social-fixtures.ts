import {
  type JWTPayload,
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
} from 'jose';

export async function socialKeys() {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'ephemeral-test-key';
  const resolver = createLocalJWKSet({ keys: [jwk] });
  async function sign(
    nonce: string,
    overrides: JWTPayload = {},
    provider: 'google' | 'apple' = 'google',
  ) {
    return new SignJWT({
      iss:
        provider === 'google'
          ? 'https://accounts.google.com'
          : 'https://appleid.apple.com',
      aud: 'native-fixture-client',
      sub: 'ephemeral-test-subject',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
      nonce,
      email: 'social-fixture@example.test',
      email_verified: true,
      name: 'Verified fixture',
      ...overrides,
    })
      .setProtectedHeader({ alg: 'RS256', kid: jwk.kid })
      .sign(privateKey);
  }
  return { resolver, sign };
}
