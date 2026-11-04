export interface SessionIdentity {
  user: { id: string; name: string; email: string };
  expires_at: string | null;
}

export interface CreatedSession extends SessionIdentity {
  token: string;
  token_type: 'Bearer';
}

export class SessionApiError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(
      status === 401 ? 'Session rejected.' : 'Session service unavailable.',
    );
    this.status = status;
  }
}

export type SessionTransport = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'status' | 'url' | 'redirected' | 'json'>>;

function identity(value: unknown): SessionIdentity {
  if (!value || typeof value !== 'object') throw new SessionApiError(0);
  const data = value as Partial<SessionIdentity>;
  if (
    !data.user ||
    typeof data.user.id !== 'string' ||
    typeof data.user.name !== 'string' ||
    typeof data.user.email !== 'string' ||
    !(
      data.expires_at === null ||
      (typeof data.expires_at === 'string' &&
        Number.isFinite(Date.parse(data.expires_at)))
    )
  )
    throw new SessionApiError(0);
  return {
    user: { id: data.user.id, name: data.user.name, email: data.user.email },
    expires_at: data.expires_at,
  };
}

export function createSessionApi(origin: string, transport: SessionTransport) {
  const parsed = new URL(origin);
  if (
    parsed.origin !== origin ||
    !['http:', 'https:'].includes(parsed.protocol)
  ) {
    throw new Error('A validated API origin is required.');
  }
  const url = `${origin}/api/v1/mobile/sessions`;

  async function request(method: string, token?: string, body?: unknown) {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 15000);
    try {
      const response = await transport(url, {
        method,
        credentials: 'omit',
        redirect: 'error',
        signal: abort.signal,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (response.redirected || (response.url && response.url !== url)) {
        throw new SessionApiError(0);
      }
      if (response.status < 200 || response.status >= 300) {
        throw new SessionApiError(response.status);
      }
      const expected =
        method === 'POST' ? 201 : method === 'DELETE' ? 204 : 200;
      if (response.status !== expected) throw new SessionApiError(0);
      return method === 'DELETE' ? null : await response.json();
    } catch (error) {
      if (error instanceof SessionApiError) throw error;
      throw new SessionApiError(0);
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async login(email: string, password: string): Promise<CreatedSession> {
      const body = await request('POST', undefined, { email, password });
      const current = identity(body);
      if (
        typeof body.token !== 'string' ||
        !/^[a-f0-9]{96}$/.test(body.token) ||
        body.token_type !== 'Bearer'
      )
        throw new SessionApiError(0);
      return { ...current, token: body.token, token_type: 'Bearer' };
    },
    async inspect(token: string): Promise<SessionIdentity> {
      return identity(await request('GET', token));
    },
    async revoke(token: string): Promise<void> {
      await request('DELETE', token);
    },
  };
}

export type SessionApi = ReturnType<typeof createSessionApi>;
