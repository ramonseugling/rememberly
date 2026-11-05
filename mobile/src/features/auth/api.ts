export type PublicTransport = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'status' | 'url' | 'redirected' | 'json'>>;

export class PublicAuthError extends Error {
  readonly status: number;
  constructor(status = 0) {
    super(
      status === 400
        ? 'Check your details. Verification codes and reset links may expire; request a new one if needed.'
        : status === 429
          ? 'Too many attempts. Please wait before trying again.'
          : status >= 500
            ? 'The service is unavailable. Please try again later.'
            : 'Unable to complete this request. Check your connection and try again.',
    );
    this.status = status;
  }
}

export interface Registration {
  name: string;
  email: string;
  password: string;
  otp_code: string;
  birth_day: number;
  birth_month: number;
  birth_year: number;
  marketing_consent: boolean;
}

export function createPublicAuthApi(
  origin: string,
  transport: PublicTransport,
  allowHttp = false,
) {
  const parsed = new URL(origin);
  if (
    parsed.origin !== origin ||
    (parsed.protocol !== 'https:' &&
      !(allowHttp && parsed.protocol === 'http:'))
  ) {
    throw new Error('A validated API origin is required.');
  }
  async function post(
    path: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    if (signal?.aborted) throw new PublicAuthError();
    const abort = new AbortController();
    const cancel = () => abort.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    const timeout = setTimeout(cancel, 15000);
    const url = `${origin}${path}`;
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
        body: JSON.stringify(body),
      });
      if (
        abort.signal.aborted ||
        response.redirected ||
        (response.url && response.url !== url)
      )
        throw new PublicAuthError();
      if (response.status < 200 || response.status >= 300)
        throw new PublicAuthError(response.status);
      const data: unknown = await response.json();
      if (
        abort.signal.aborted ||
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data)
      )
        throw new PublicAuthError();
      return data as Record<string, unknown>;
    } catch (error) {
      throw error instanceof PublicAuthError ? error : new PublicAuthError();
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', cancel);
    }
  }
  return {
    async sendCode(email: string, signal?: AbortSignal) {
      const data = await post(
        '/api/v1/otp',
        { email: email.trim().toLowerCase() },
        signal,
      );
      if (typeof data.message !== 'string') throw new PublicAuthError();
    },
    async register(input: Registration, signal?: AbortSignal) {
      const data = await post('/api/v1/users', input, signal);
      if (typeof data.id !== 'string') throw new PublicAuthError();
    },
    async forgotPassword(email: string, signal?: AbortSignal) {
      const data = await post(
        '/api/v1/password/forgot',
        { email: email.trim().toLowerCase() },
        signal,
      );
      if (
        typeof data.message !== 'string' ||
        (data.google_only !== undefined &&
          typeof data.google_only !== 'boolean')
      )
        throw new PublicAuthError();
      return { googleOnly: data.google_only === true };
    },
    async resetPassword(token: string, password: string, signal?: AbortSignal) {
      const data = await post(
        '/api/v1/password/reset',
        { token, password },
        signal,
      );
      if (typeof data.message !== 'string') throw new PublicAuthError();
    },
  };
}

export function emailError(value: string): string | null {
  return value.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? null
    : 'Enter a valid email address.';
}
export function passwordError(
  value: string,
  confirmation: string,
): string | null {
  if (value.length < 8 || value.length > 72)
    return 'Use a password with 8 to 72 characters.';
  return value === confirmation ? null : 'The passwords do not match.';
}
export function registrationError(
  input: Registration,
  confirmation: string,
  now = new Date(),
): string | null {
  if (input.name.trim().length < 2 || input.name.trim().length > 100)
    return 'Use a name with 2 to 100 characters.';
  const basic =
    emailError(input.email) ?? passwordError(input.password, confirmation);
  if (basic) return basic;
  if (!/^\d{6}$/.test(input.otp_code))
    return 'Enter the six-digit email verification code.';
  const { birth_day: day, birth_month: month, birth_year: year } = input;
  if (
    ![day, month, year].every(Number.isInteger) ||
    year < 1900 ||
    year > now.getFullYear() ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  )
    return 'Enter your birth date using day, month, and year.';
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date > now
  )
    return 'Enter a valid birth date in the past.';
  return null;
}
