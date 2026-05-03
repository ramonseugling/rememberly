export function getBirthdayInfo(
  birth_day: number | null,
  birth_month: number | null,
): { daysUntil: number | null; isNextYear: boolean } {
  if (!birth_day || !birth_month) return { daysUntil: null, isNextYear: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisYear = today.getFullYear();
  const thisYearBirthday = new Date(thisYear, birth_month - 1, birth_day);
  thisYearBirthday.setHours(0, 0, 0, 0);

  const isNextYear = thisYearBirthday < today;
  const nextBirthday = isNextYear
    ? new Date(thisYear + 1, birth_month - 1, birth_day)
    : thisYearBirthday;

  const daysUntil = Math.round(
    (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return { daysUntil, isNextYear };
}

export function getDaysUntilBirthday(
  birth_day: number | null,
  birth_month: number | null,
): number | null {
  return getBirthdayInfo(birth_day, birth_month).daysUntil;
}

export function formatDaysLabel(days: number): string {
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
