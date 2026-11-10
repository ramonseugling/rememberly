export const MIN_AGE = 12;

export const MIN_AGE_MESSAGE =
  'É preciso ter 12 anos ou mais para usar o Rememberly.';

export interface BirthDate {
  day: number;
  month: number;
  year?: number | null;
}

// Returns true when the person has reached `minAge` on `today`.
// Without a birth year the age cannot be verified, so the check passes.
// A Feb 29 birthday counts as reached on Mar 1 in non-leap years
// (Date rolls the missing day over to the next month).
export function isAtLeastAge(
  birth: BirthDate,
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
