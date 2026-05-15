export type EventType =
  | 'birthday'
  | 'dating_anniversary'
  | 'wedding_anniversary'
  | 'celebration'
  | 'custom';

export type GroupRole = 'owner' | 'member';

export interface BirthdayMember {
  name: string;
  birth_day: number;
  birth_month: number;
  days_until: number;
}

export interface GroupInfo {
  id: string;
  name: string;
  invite_code: string;
  role: GroupRole;
  member_count: number;
  created_at: string;
  upcoming_birthdays: BirthdayMember[];
}

export interface UpcomingHighlight {
  member: BirthdayMember;
  groups: { id: string; name: string }[];
}

export interface GroupMemberInfo {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
  role: GroupRole;
  joined_at: string;
}
