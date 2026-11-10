export const MIN_AGE = 12;

// Mirrors lib/age.ts on the server. Without a birth year the age cannot be
// verified, so the check passes. A Feb 29 birthday counts as reached on Mar 1
// in non-leap years (Date.UTC rolls the missing day over).
export function isAtLeastAge(
  birth: { day: number; month: number; year?: number | null },
  minAge: number,
  today: Date,
): boolean {
  if (birth.year === undefined || birth.year === null) return true;
  const reachedOn = Date.UTC(birth.year + minAge, birth.month - 1, birth.day);
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return todayUtc >= reachedOn;
}
