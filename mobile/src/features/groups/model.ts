export type GroupRole = 'owner' | 'member';

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  role: GroupRole;
  member_count: number;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: GroupRole;
  birth_day: number | null;
  birth_month: number | null;
  daysUntil: number | null;
}

export function groupNameError(value: string): string | null {
  if (!value.trim()) return 'Enter a group name.';
  if (value.trim().length > 100) return 'Use at most 100 characters.';
  return null;
}

export function canRemoveMember(
  role: GroupRole,
  currentUserId: string,
  member: Pick<GroupMember, 'id' | 'role'>,
): boolean {
  return (
    role === 'owner' && member.id !== currentUserId && member.role !== 'owner'
  );
}

export function inviteUrl(origin: string, code: string): string {
  return `${origin}/join-group?code=${encodeURIComponent(code)}`;
}

export function birthdayLabel(member: GroupMember): string {
  if (member.birth_day === null || member.birth_month === null) {
    return 'Birthday not shared';
  }
  const date = new Date(
    Date.UTC(2000, member.birth_month - 1, member.birth_day),
  );
  const label = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  if (member.daysUntil === 0) return `${label} · Today!`;
  if (member.daysUntil === 1) return `${label} · Tomorrow`;
  return member.daysUntil === null
    ? label
    : `${label} · In ${member.daysUntil} days`;
}
