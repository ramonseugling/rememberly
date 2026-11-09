export const PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function promptStorageKey(
  environment: string,
  origin: string,
  userId: string,
) {
  const suffix = Array.from(origin)
    .map((character) => character.charCodeAt(0).toString(16))
    .join('');
  const user = userId.replace(/[^a-zA-Z0-9._-]/g, '');
  return `rememberly.notification-prompt.${environment}.${suffix}.${user}`;
}

export function parseDismissedAt(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function shouldPrompt(input: {
  pushEnabled: boolean;
  unavailable: boolean;
  dismissedAt: number | null;
  now: number;
}): boolean {
  if (input.pushEnabled || input.unavailable) return false;
  if (input.dismissedAt === null) return true;
  return input.now - input.dismissedAt >= PROMPT_COOLDOWN_MS;
}
