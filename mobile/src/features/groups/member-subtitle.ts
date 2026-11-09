import { daysBadge } from '../../design-system/badge/days.ts';
import { birthdayDateLabel } from './model.ts';
import type { GroupMember } from './model.ts';

export function memberSubtitle(member: GroupMember): string {
  const parts: string[] = [];
  if (member.role === 'owner') parts.push('Criador');
  parts.push(birthdayDateLabel(member));
  if (member.isNextYear) parts.push('Ano que vem');
  else if (member.daysUntil !== null)
    parts.push(daysBadge(member.daysUntil).label);
  return parts.join(' · ');
}
