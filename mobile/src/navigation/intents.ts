export type LinkIntent =
  | { kind: 'invitation'; code: string }
  | { kind: 'gift-list'; userId: string };
export type NotificationIntent = {
  kind: 'notification';
  tab: 'dates' | 'groups' | 'occasions' | 'birthday' | 'home';
  userId?: string;
};
export type PendingIntent = LinkIntent | NotificationIntent;

export function inviteCode(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9_-]{8}$/.test(value);
}
export function resourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      value,
    )
  );
}

export function parseNativeLink(
  input: string,
  developmentOrigin?: string,
): LinkIntent | null {
  if (
    input.includes('%') ||
    /(?:^|\/)\.\.?(?:\/|$)/.test(input.split('?')[0]) ||
    input.length > 512 ||
    /[\s\\]/.test(input) ||
    /%(?![a-f0-9]{2})/i.test(input)
  )
    return null;
  try {
    const url = new URL(
      input.startsWith('/') && !input.startsWith('//')
        ? `rememberly://app${input}`
        : input,
    );
    if (url.username || url.password || url.hash) return null;
    let path = url.pathname;
    if (url.protocol === 'rememberly:') {
      if (url.port) return null;
      if (url.hostname && url.hostname !== 'app')
        path = `/${url.hostname}${path}`;
    } else {
      const trusted = [
        'https://rememberly.com.br',
        'https://www.rememberly.com.br',
      ];
      if (developmentOrigin) trusted.push(developmentOrigin);
      if (!trusted.includes(url.origin)) return null;
    }
    const entries = [...url.searchParams.entries()];
    if (entries.length !== 1) return null;
    const [key, value] = entries[0];
    if (path === '/join-group' && key === 'code' && inviteCode(value))
      return { kind: 'invitation', code: value };
    if (path === '/gift-list' && key === 'user' && resourceId(value))
      return { kind: 'gift-list', userId: value };
    return null;
  } catch {
    return null;
  }
}

export function intentPath(intent: LinkIntent): string {
  return intent.kind === 'invitation'
    ? `/join-group?code=${intent.code}`
    : `/gift-list?user=${intent.userId}`;
}

export function pendingPath(intent: PendingIntent): string {
  if (intent.kind === 'invitation') return intentPath(intent);
  if (intent.kind === 'gift-list')
    return `/(tabs)/birthday?userId=${intent.userId}`;
  return notificationPath(intent);
}

export function parseNotification(data: unknown): NotificationIntent | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const value = data as Record<string, unknown>;
  if (value.kind === 'daily') return { kind: 'notification', tab: 'home' };
  if (value.kind === 'event' && resourceId(value.event_id))
    return { kind: 'notification', tab: 'dates' };
  if (value.kind === 'birthday' && resourceId(value.user_id))
    return { kind: 'notification', tab: 'birthday', userId: value.user_id };
  if (
    value.kind === 'commemorative' &&
    typeof value.date_key === 'string' &&
    [
      'mothers_day',
      'fathers_day',
      'valentines_day',
      'childrens_day',
      'christmas',
    ].includes(value.date_key)
  )
    return { kind: 'notification', tab: 'occasions' };
  return null;
}

export function notificationPath(intent: NotificationIntent) {
  if (intent.tab === 'birthday' && intent.userId)
    return `/(tabs)/birthday?userId=${intent.userId}`;
  if (intent.tab === 'home') return '/(tabs)';
  return intent.tab === 'dates'
    ? '/(tabs)/events'
    : intent.tab === 'groups'
      ? '/(tabs)/groups'
      : '/(tabs)/occasions';
}

/** Single in-memory intent; account-bound work never crosses a logout or switch. */
export class IntentQueue {
  private pending: { intent: PendingIntent; owner: string | null } | null =
    null;
  private previousUser: string | null = null;
  enqueue(intent: PendingIntent, user: string | null) {
    this.pending = { intent, owner: user };
  }
  identity(user: string | null) {
    if (this.previousUser && this.previousUser !== user) this.pending = null;
    this.previousUser = user;
  }
  take(user: string): PendingIntent | null {
    const next = this.pending;
    this.pending = null;
    return next && (!next.owner || next.owner === user) ? next.intent : null;
  }
  clear() {
    this.pending = null;
  }
}

/** Keep only the latest 100 handled request IDs for this runtime. */
export function acceptNotificationId(seen: Set<string>, id: string): boolean {
  if (seen.has(id)) return false;
  seen.add(id);
  if (seen.size > 100) {
    const oldest = seen.values().next().value;
    if (oldest !== undefined) seen.delete(oldest);
  }
  return true;
}
