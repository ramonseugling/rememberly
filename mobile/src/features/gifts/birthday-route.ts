export type BirthdayOrigin = 'home' | 'events' | 'groups';

const ORIGIN_PATHS = {
  home: '/(tabs)',
  events: '/(tabs)/events',
  groups: '/(tabs)/groups',
} as const;

export function parseOrigin(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'events' || raw === 'groups' ? raw : 'home';
}

export function originPath(origin: BirthdayOrigin) {
  return ORIGIN_PATHS[origin];
}

// Every screen that opens a birthday page says where it came from, so the
// back buttons can go there directly instead of relying on tab history.
export function birthdayRoute(userId: string, from: BirthdayOrigin) {
  return {
    pathname: '/(tabs)/birthday' as const,
    params: { userId, from },
  };
}
