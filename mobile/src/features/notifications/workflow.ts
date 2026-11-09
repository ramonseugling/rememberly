export interface NotificationPreferences {
  push_enabled: boolean;
  email_events: boolean;
  email_marketing: boolean;
  time_zone: string;
  daily_time: string;
}

export function foregroundPresentation(sessionStatus: string) {
  const authenticated = sessionStatus === 'authenticated';
  return {
    shouldShowBanner: authenticated,
    shouldShowList: authenticated,
    shouldPlaySound: false,
    shouldSetBadge: false,
  };
}

export interface NotificationNative {
  unavailableReason(): string | null;
  permission(): Promise<{ granted: boolean; canAskAgain: boolean }>;
  requestPermission(): Promise<{ granted: boolean; canAskAgain: boolean }>;
  installationId(): Promise<string>;
  token(): Promise<string>;
  platform: 'ios' | 'android';
}

export interface NotificationApi {
  request<T>(
    path: string,
    options?: {
      method?: 'POST' | 'PATCH' | 'DELETE';
      body?: unknown;
      signal?: AbortSignal;
    },
  ): Promise<T>;
}

export type NotificationResult = {
  kind: 'registered' | 'disabled' | 'denied' | 'unsupported' | 'stale';
  message: string;
};

export async function updateNotifications(
  enabled: boolean,
  native: NotificationNative,
  api: NotificationApi,
  active: () => boolean,
  signal: AbortSignal,
): Promise<NotificationResult> {
  const stale = (): NotificationResult => ({ kind: 'stale', message: '' });
  const current = () => active() && !signal.aborted;
  if (!current()) return stale();
  if (!enabled) {
    await api.request('/api/v1/mobile/notification-preferences', {
      method: 'PATCH',
      body: { push_enabled: false },
      signal,
    });
    if (!current()) return stale();
    try {
      const installation = await native.installationId();
      if (!current()) return stale();
      await api.request(`/api/v1/mobile/push-devices/${installation}`, {
        method: 'DELETE',
        signal,
      });
    } catch {
      if (!current()) return stale();
      throw new Error(
        'Push is disabled for your account. Device cleanup failed; check your connection and retry turning off.',
      );
    }
    return current()
      ? { kind: 'disabled', message: 'Push is disabled for your account.' }
      : stale();
  }
  const reason = native.unavailableReason();
  if (reason) return { kind: 'unsupported', message: reason };
  let permission = await native.permission();
  if (!current()) return stale();
  if (!permission.granted && permission.canAskAgain) {
    permission = await native.requestPermission();
    if (!current()) return stale();
  }
  if (!permission.granted) {
    return {
      kind: 'denied',
      message:
        'Notifications are not allowed on this device. Allow them in Settings, then retry enabling push.',
    };
  }
  const installation = await native.installationId();
  if (!current()) return stale();
  const token = await native.token();
  if (!current()) return stale();
  await api.request('/api/v1/mobile/push-devices', {
    method: 'POST',
    body: {
      installation_id: installation,
      expo_push_token: token,
      platform: native.platform,
    },
    signal,
  });
  if (!current()) return stale();
  await api.request('/api/v1/mobile/notification-preferences', {
    method: 'PATCH',
    body: { push_enabled: true },
    signal,
  });
  return current()
    ? {
        kind: 'registered',
        message:
          'This device is registered. Delivery depends on the notification service, device settings, and connectivity.',
      }
    : stale();
}

export function installationStorageKey(environment: string, origin: string) {
  const suffix = Array.from(origin)
    .map((character) => character.charCodeAt(0).toString(16))
    .join('');
  return `rememberly.push-installation.${environment}.${suffix}`;
}
