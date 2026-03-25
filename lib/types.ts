export type EventType =
  | 'birthday'
  | 'dating_anniversary'
  | 'wedding_anniversary'
  | 'celebration'
  | 'custom';

export type GroupRole = 'owner' | 'member';

export interface GroupInfo {
  id: string;
  name: string;
  invite_code: string;
  role: GroupRole;
  member_count: number;
  created_at: string;
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
