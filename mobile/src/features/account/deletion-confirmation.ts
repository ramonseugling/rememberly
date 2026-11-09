export const DELETION_PHRASE = 'Excluir minha conta';

export type DeletionMode = 'password' | 'code';

export interface DeletionCredential {
  mode: DeletionMode;
  value: string;
}

export function canDeleteAccount(
  credential: DeletionCredential,
  confirmation: string,
) {
  if (confirmation !== DELETION_PHRASE) return false;
  return credential.mode === 'password'
    ? credential.value.length > 0
    : /^[0-9]{6}$/.test(credential.value);
}

export function deletionBody(credential: DeletionCredential) {
  return credential.mode === 'password'
    ? { password: credential.value, confirmation: DELETION_PHRASE }
    : { otp_code: credential.value, confirmation: DELETION_PHRASE };
}

export function deletionErrorMessage(
  status: number | undefined,
  mode: DeletionMode,
): string {
  if (status === 403)
    return 'Não foi possível confirmar sua senha atual. Digite-a novamente ou use um código por e-mail.';
  if (status === 409)
    return 'Você é responsável por um ou mais grupos. Exclua seus grupos antes de excluir a conta. Sua conta não foi excluída.';
  if (status === 400 && mode === 'code')
    return 'Código inválido ou expirado. Confira o código ou peça um novo.';
  if (status === 429)
    return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  return 'Não foi possível excluir sua conta. Tente novamente.';
}

// Tickets contain no credentials. An old confirmation cannot authorize a new session.
export function createDeletionConfirmation<Scope>() {
  let active: { scope: Scope; phase: 'confirming' | 'submitting' } | null =
    null;
  return {
    open(scope: Scope) {
      if (active) return null;
      active = { scope, phase: 'confirming' };
      return active;
    },
    submit(ticket: object, scope: Scope) {
      if (
        active !== ticket ||
        active.scope !== scope ||
        active.phase !== 'confirming'
      )
        return false;
      active.phase = 'submitting';
      return true;
    },
    current(ticket: object, scope: Scope) {
      return active === ticket && active.scope === scope;
    },
    cancel(ticket: object) {
      if (active !== ticket || active.phase !== 'confirming') return false;
      active = null;
      return true;
    },
    invalidate() {
      active = null;
    },
  };
}
