export function birthdayHeadline(name: string, days: number | null): string {
  if (days === null) return `Aniversário de ${name}`;
  if (days === 0) return `Hoje é o dia de ${name}! 🎉`;
  if (days === 1) return `O aniversário de ${name} é amanhã`;
  return `O aniversário de ${name} é em ${days} dias`;
}

export function groupsLabel(groups: string[]): string {
  const [first, ...rest] = groups;
  if (!first) return '';
  return rest.length === 0
    ? first
    : `${first} e mais ${rest.length === 1 ? '1 grupo' : `${rest.length} grupos`}`;
}
