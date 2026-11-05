export function canDeleteAccount(password: string, confirmation: string) {
  return password.length > 0 && confirmation === 'DELETE';
}

// Tickets contain no credentials. An old native alert cannot authorize a new session.
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
