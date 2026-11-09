import type { Group } from './model';

export function groupSubtitle(group: Group): string {
  const members = `${group.member_count} ${group.member_count === 1 ? 'membro' : 'membros'}`;
  if (group.role === 'owner') return `${members} · Criado por você`;
  return group.created_by_name
    ? `${members} · Criado por ${group.created_by_name}`
    : members;
}
