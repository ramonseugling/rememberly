import { isAtLeastAge, MIN_AGE } from '../account/age.ts';

export type PublicTransport = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'status' | 'url' | 'redirected' | 'json'>>;

const KNOWN_BAD_REQUESTS: Record<string, string> = {
  'Este e-mail já está em uso.': 'Este e-mail já está associado a outra conta.',
  'Verificação inválida ou expirada.':
    'A confirmação expirou. Volte e peça um novo código.',
  'Código de verificação incorreto.':
    'O código está incorreto. Confira o e-mail e tente de novo.',
  'Código de verificação inválido, expirado ou tentativas esgotadas.':
    'O código expirou ou as tentativas acabaram. Solicite um novo código.',
  'A verificação do e-mail é inválida ou expirou.':
    'A confirmação do e-mail expirou. Volte ao e-mail e peça um novo código.',
};

export class PublicAuthError extends Error {
  readonly status: number;
  constructor(status = 0, serverMessage: string | null = null) {
    super(
      status === 400 && serverMessage && KNOWN_BAD_REQUESTS[serverMessage]
        ? KNOWN_BAD_REQUESTS[serverMessage]
        : status === 400
          ? 'Confira seus dados. O código ou link pode ter expirado; solicite um novo se necessário.'
          : status === 429
            ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
            : status >= 500
              ? 'O serviço está indisponível. Tente novamente mais tarde.'
              : 'Não foi possível concluir a solicitação. Confira sua conexão e tente novamente.',
    );
    this.status = status;
  }
}

async function errorMessage(response: { json: () => Promise<unknown> }) {
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body?.message === 'string' ? body.message : null;
  } catch {
    return null;
  }
}

export const TERMS_REQUIRED_MESSAGE =
  'Aceite os Termos de Uso e a Política de Privacidade para criar a conta.';

export interface Registration {
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
  otp_code: string;
  birth_day: number;
  birth_month: number;
  birth_year: number;
  marketing_consent: boolean;
  accepted_terms: boolean;
}

export type RegistrationRequest = Omit<Registration, 'otp_code'> & {
  verification_token: string;
};

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
  async function send(
    method: 'GET' | 'POST',
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
        method,
        credentials: 'omit',
        redirect: 'error',
        signal: abort.signal,
        headers:
          method === 'GET'
            ? { Accept: 'application/json' }
            : {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
        body: method === 'GET' ? undefined : JSON.stringify(body),
      });
      if (
        abort.signal.aborted ||
        response.redirected ||
        (response.url && response.url !== url)
      )
        throw new PublicAuthError();
      if (response.status < 200 || response.status >= 300)
        throw new PublicAuthError(
          response.status,
          response.status === 400 ? await errorMessage(response) : null,
        );
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
  const post = (path: string, body: unknown, signal?: AbortSignal) =>
    send('POST', path, body, signal);
  return {
    async sendCode(email: string, signal?: AbortSignal) {
      const data = await post(
        '/api/v1/otp',
        { email: email.trim().toLowerCase() },
        signal,
      );
      if (typeof data.message !== 'string') throw new PublicAuthError();
    },
    async verifyCode(email: string, code: string, signal?: AbortSignal) {
      const data = await post(
        '/api/v1/otp/verify',
        { email: email.trim().toLowerCase(), otp_code: code },
        signal,
      );
      if (
        typeof data.verification_token !== 'string' ||
        !/^[0-9a-f]{64}$/.test(data.verification_token)
      )
        throw new PublicAuthError();
      return data.verification_token;
    },
    async register(
      input: Registration | RegistrationRequest,
      signal?: AbortSignal,
    ) {
      const data = await post(
        '/api/v1/users',
        { ...input, accepted_terms: true },
        signal,
      );
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
    async invitePreview(code: string, signal?: AbortSignal) {
      const data = await send(
        'GET',
        `/api/v1/groups/invite?code=${encodeURIComponent(code)}`,
        undefined,
        signal,
      );
      if (typeof data.name !== 'string' || !data.name)
        throw new PublicAuthError();
      return { name: data.name };
    },
    async verifyResetCode(email: string, code: string, signal?: AbortSignal) {
      const data = await post(
        '/api/v1/password/verify',
        { email: email.trim().toLowerCase(), otp_code: code },
        signal,
      );
      if (
        typeof data.reset_token !== 'string' ||
        !/^[a-f0-9]{96}$/.test(data.reset_token)
      )
        throw new PublicAuthError();
      return data.reset_token;
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

const NAME_PATTERN = /^\p{L}+(?: \p{L}+)*$/u;

export function nameError(
  value: string,
  label: 'nome' | 'sobrenome',
): string | null {
  const text = value.trim();
  if (text.length < 2 || text.length > 60)
    return `Informe seu ${label} com 2 a 60 caracteres.`;
  return NAME_PATTERN.test(text) ? null : `Use apenas letras no ${label}.`;
}

export function emailError(value: string): string | null {
  return value.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? null
    : 'Informe um e-mail válido.';
}
export function passwordError(
  value: string,
  confirmation: string,
): string | null {
  if (value.length < 8 || value.length > 72)
    return 'Use uma senha entre 8 e 72 caracteres.';
  return value === confirmation ? null : 'As senhas são diferentes.';
}
export function registrationError(
  input: Registration,
  confirmation: string,
  now = new Date(),
): string | null {
  return (
    registrationDetailsError(input, confirmation, now) ??
    (/^\d{6}$/.test(input.otp_code)
      ? null
      : 'Informe o código de 6 dígitos enviado por e-mail.')
  );
}

export function registrationDetailsError(
  input: Omit<Registration, 'otp_code'>,
  confirmation: string,
  now = new Date(),
): string | null {
  if (!input.accepted_terms) return TERMS_REQUIRED_MESSAGE;
  if (input.name.trim().length < 2 || input.name.trim().length > 100)
    return 'Use um nome entre 2 e 100 caracteres.';
  const basic =
    emailError(input.email) ?? passwordError(input.password, confirmation);
  if (basic) return basic;
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
    return 'Informe sua data de nascimento com dia, mês e ano.';
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date > now
  )
    return 'Informe uma data de nascimento válida no passado.';
  if (!isAtLeastAge({ day, month, year }, MIN_AGE, now))
    return 'É preciso ter 12 anos ou mais para criar uma conta.';
  return null;
}
