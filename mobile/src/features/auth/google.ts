import type { CreatedSession, SessionTransport } from '../../session/api.ts';
import { SessionApiError } from '../../session/api.ts';

export const googleReturnUrl = 'rememberly://auth/google';

interface GoogleNative {
  random(): string;
  challenge(verifier: string): Promise<string>;
  open(url: string, returnUrl: string): Promise<{ type: string; url?: string }>;
}

export function googleLogin(
  origin: string,
  transport: SessionTransport,
  native: GoogleNative,
) {
  const parsed = new URL(origin);
  if (
    parsed.origin !== origin ||
    !['https:', 'http:'].includes(parsed.protocol)
  )
    throw new Error('A validated API origin is required.');
  return async (): Promise<CreatedSession | null> => {
    const verifier = native.random();
    const state = native.random();
    const challenge = await native.challenge(verifier);
    const start = `${origin}/api/v1/mobile/auth/google/start?${new URLSearchParams({ state, code_challenge: challenge })}`;
    const result = await native.open(start, googleReturnUrl);
    if (result.type === 'cancel' || result.type === 'dismiss') return null;
    if (result.type !== 'success' || !result.url || result.url.length > 512)
      throw new SessionApiError(0);
    const returned = new URL(result.url);
    const params = returned.searchParams;
    if (
      returned.origin !== new URL(googleReturnUrl).origin ||
      returned.protocol !== 'rememberly:' ||
      returned.hostname !== 'auth' ||
      returned.pathname !== '/google' ||
      returned.username ||
      returned.password ||
      returned.port ||
      returned.hash ||
      params.getAll('state').length !== 1 ||
      params.get('state') !== state
    )
      throw new SessionApiError(0);
    if (params.get('error') === 'cancelled' && params.size === 2) return null;
    const code = params.get('code');
    if (params.size !== 2 || !code || !/^[a-f0-9]{64}$/.test(code))
      throw new SessionApiError(0);
    const url = `${origin}/api/v1/mobile/auth/google/exchange`;
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 15000);
    try {
      const response = await transport(url, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'error',
        signal: abort.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state, code_verifier: verifier }),
      });
      if (
        abort.signal.aborted ||
        response.redirected ||
        (response.url && response.url !== url)
      )
        throw new SessionApiError(0);
      if (response.status !== 201) throw new SessionApiError(response.status);
      const data: unknown = await response.json();
      if (abort.signal.aborted || !data || typeof data !== 'object')
        throw new SessionApiError(0);
      const created = data as Partial<CreatedSession>;
      if (
        typeof created.token !== 'string' ||
        !/^[a-f0-9]{96}$/.test(created.token) ||
        created.token_type !== 'Bearer' ||
        created.expires_at !== null ||
        !created.user ||
        typeof created.user.id !== 'string' ||
        typeof created.user.email !== 'string' ||
        typeof created.user.name !== 'string'
      )
        throw new SessionApiError(0);
      return created as CreatedSession;
    } catch (error) {
      throw error instanceof SessionApiError ? error : new SessionApiError(0);
    } finally {
      clearTimeout(timeout);
    }
  };
}
