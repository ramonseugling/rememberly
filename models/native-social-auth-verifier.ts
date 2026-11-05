import { type JWTVerifyGetKey, createRemoteJWKSet, jwtVerify } from 'jose';

export type NativeSocialProvider = 'google' | 'apple';

export class NativeSocialAuthError extends Error {
  constructor(readonly code: 'unavailable' | 'invalid' | 'collision') {
    super('Native social authentication failed.');
  }
}

const providers = {
  google: {
    environment: 'GOOGLE_NATIVE_CLIENT_IDS',
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    jwks: 'https://www.googleapis.com/oauth2/v3/certs',
  },
  apple: {
    environment: 'APPLE_NATIVE_CLIENT_IDS',
    issuer: ['https://appleid.apple.com'],
    jwks: 'https://appleid.apple.com/auth/keys',
  },
} as const;
const keys = {
  google: createRemoteJWKSet(new URL(providers.google.jwks), {
    timeoutDuration: 5000,
  }),
  apple: createRemoteJWKSet(new URL(providers.apple.jwks), {
    timeoutDuration: 5000,
  }),
};

export function configuredAudiences(provider: NativeSocialProvider) {
  const values = process.env[providers[provider].environment]
    ?.split(',')
    .map((value) => value.trim());
  if (
    !values?.length ||
    values.some((value) => !value || value.length > 512 || /[\s*]/.test(value))
  ) {
    throw new NativeSocialAuthError('unavailable');
  }
  return values;
}

// Resolver injection is for server-side crypto fixtures only. HTTP callers cannot select issuers or keys.
export async function verifyNativeIdentityToken(
  provider: NativeSocialProvider,
  token: string,
  resolver: JWTVerifyGetKey = keys[provider],
) {
  const audience = configuredAudiences(provider);
  try {
    const { payload } = await jwtVerify(token, resolver, {
      algorithms: ['RS256'],
      issuer: [...providers[provider].issuer],
      audience,
      requiredClaims: ['iss', 'sub', 'aud', 'exp', 'iat', 'nonce'],
      maxTokenAge: '10m',
      clockTolerance: 5,
    });
    if (
      typeof payload.sub !== 'string' ||
      !payload.sub.trim() ||
      payload.sub.length > 255 ||
      typeof payload.nonce !== 'string' ||
      !payload.nonce ||
      payload.nonce.length > 512 ||
      (payload.azp !== undefined &&
        (typeof payload.azp !== 'string' || !audience.includes(payload.azp))) ||
      (Array.isArray(payload.aud) &&
        payload.aud.length > 1 &&
        typeof payload.azp !== 'string')
    ) {
      throw new NativeSocialAuthError('invalid');
    }
    let email: string | null = null;
    if (payload.email !== undefined) {
      if (
        typeof payload.email !== 'string' ||
        payload.email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) ||
        !(
          payload.email_verified === true ||
          (provider === 'apple' && payload.email_verified === 'true')
        )
      ) {
        throw new NativeSocialAuthError('invalid');
      }
      email = payload.email.toLowerCase();
    }
    if (provider === 'google' && !email)
      throw new NativeSocialAuthError('invalid');
    return {
      subject: payload.sub,
      nonce: payload.nonce,
      email,
      name:
        typeof payload.name === 'string' && payload.name.trim()
          ? payload.name.trim().slice(0, 100)
          : 'Rememberly user',
    };
  } catch (error) {
    if (error instanceof NativeSocialAuthError) throw error;
    // Provider availability errors never reveal JWKS URLs, token content or cryptographic details.
    const code = (error as { code?: string }).code;
    throw new NativeSocialAuthError(
      code === 'ERR_JWKS_TIMEOUT' || error instanceof TypeError
        ? 'unavailable'
        : 'invalid',
    );
  }
}
