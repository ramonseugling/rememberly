export type GroupRole = 'owner' | 'member';

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  role: GroupRole;
  member_count: number;
  created_at?: string;
  created_by_name?: string;
  current_month?: number;
  upcoming_birthdays?: GroupBirthday[];
}

export interface GroupBirthday {
  name: string;
  birth_day: number;
  birth_month: number;
  days_until: number;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: GroupRole;
  birth_day: number | null;
  birth_month: number | null;
  daysUntil: number | null;
  weekday?: string;
  isNextYear?: boolean;
}

export function groupNameError(value: string): string | null {
  if (!value.trim()) return 'Informe o nome do grupo.';
  if (value.trim().length > 100) return 'Use no máximo 100 caracteres.';
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
    return 'Aniversário não informado';
  }
  const date = new Date(
    Date.UTC(2000, member.birth_month - 1, member.birth_day),
  );
  const label = date.toLocaleDateString('pt-BR', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return member.weekday ? `${label} (${member.weekday})` : label;
}

export function daysLabel(days: number): string {
  if (days === 0) return 'Hoje! 🎉';
  if (days === 1) return 'Amanhã';
  if (days <= 7) return `Em ${days} dias`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Em ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  const months = Math.round(days / 30);
  return `Em ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

export function orderedBirthdays(members: GroupMember[]): GroupMember[] {
  return members
    .filter(
      (member) =>
        member.birth_day !== null &&
        member.birth_month !== null &&
        member.daysUntil !== null,
    )
    .sort((a, b) => a.daysUntil! - b.daysUntil!);
}

export function orderedMembers(members: GroupMember[]): GroupMember[] {
  return [...members].sort((a, b) => {
    if (a.daysUntil === null && b.daysUntil === null) return 0;
    if (a.daysUntil === null) return 1;
    if (b.daysUntil === null) return -1;
    return a.daysUntil - b.daysUntil;
  });
}

export function birthdayDateLabel(
  member: Pick<GroupMember, 'birth_day' | 'birth_month'>,
): string {
  if (member.birth_day === null || member.birth_month === null) {
    return 'Aniversário não informado';
  }
  return new Date(
    Date.UTC(2000, member.birth_month - 1, member.birth_day),
  ).toLocaleDateString('pt-BR', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function birthdaysInMonth(
  birthdays: GroupMember[],
  month: number,
): GroupMember[] {
  return birthdays.filter((member) => member.birth_month === month);
}
