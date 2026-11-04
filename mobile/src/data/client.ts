import type { SessionTransport } from '../session/api.ts';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export type ApiErrorKind = 'http' | 'network' | 'cancelled' | 'stale';

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;

  constructor(kind: ApiErrorKind, status = 0) {
    const messages: Record<number, string> = {
      400: 'Check the information you entered and try again.',
      401: 'Your session is no longer valid. Please sign in again.',
      403: 'You do not have permission to perform this action.',
      404: 'This item is no longer available.',
      409: 'This item has changed. Refresh and try again.',
      429: 'Too many requests. Please try again later.',
    };
    super(
      kind === 'cancelled'
        ? 'Request cancelled.'
        : kind === 'stale'
          ? 'The active session has changed.'
          : kind === 'http'
            ? (messages[status] ??
              'The service is unavailable. Please try again.')
            : 'Unable to connect. Check your connection and try again.',
    );
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
  }
}

export type AuthenticatedTransport = <T>(
  path: string,
  token: string,
  options?: RequestOptions,
) => Promise<T>;

export function createAuthenticatedTransport(
  origin: string,
  transport: SessionTransport,
): AuthenticatedTransport {
  const parsed = new URL(origin);
  if (
    parsed.origin !== origin ||
    !['https:', 'http:'].includes(parsed.protocol)
  ) {
    throw new Error('A validated API origin is required.');
  }

  return async function request<T>(
    path: string,
    token: string,
    options: RequestOptions = {},
  ): Promise<T> {
    if (!path.startsWith('/api/v1/') || /[\\\u0000-\u0020]/.test(path)) {
      throw new ApiError('network');
    }
    const url = new URL(path, origin);
    if (
      url.origin !== origin ||
      !url.pathname.startsWith('/api/v1/') ||
      url.hash
    ) {
      throw new ApiError('network');
    }
    const method = options.method ?? 'GET';
    if (
      !['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(method) ||
      (method === 'GET' && options.body !== undefined)
    ) {
      throw new ApiError('network');
    }
    if (options.signal?.aborted) throw new ApiError('cancelled');
    const abort = new AbortController();
    const cancel = () => abort.abort();
    options.signal?.addEventListener('abort', cancel, { once: true });
    const timeout = setTimeout(cancel, 15000);
    try {
      const response = await transport(url.href, {
        method,
        credentials: 'omit',
        redirect: 'error',
        signal: abort.signal,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options.body === undefined
            ? {}
            : { 'Content-Type': 'application/json' }),
        },
        ...(options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
      });
      if (abort.signal.aborted) {
        throw new ApiError(options.signal?.aborted ? 'cancelled' : 'network');
      }
      if (response.redirected || (response.url && response.url !== url.href)) {
        throw new ApiError('network');
      }
      if (response.status < 200 || response.status >= 300)
        throw new ApiError('http', response.status);
      const data = response.status === 204 ? null : await response.json();
      if (abort.signal.aborted)
        throw new ApiError(options.signal?.aborted ? 'cancelled' : 'network');
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(options.signal?.aborted ? 'cancelled' : 'network');
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', cancel);
    }
  };
}
