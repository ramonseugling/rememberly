export function dayOptions(month: string) {
  if (!/^(?:[1-9]|1[0-2])$/.test(month)) return [];
  return Array.from(
    { length: new Date(2000, Number(month), 0).getDate() },
    (_, index) => ({ value: String(index + 1), label: String(index + 1) }),
  );
}

export function daysInMonth(month: string): number {
  return /^(?:[1-9]|1[0-2])$/.test(month)
    ? new Date(2000, Number(month), 0).getDate()
    : 31;
}

export function sanitizeDay(value: string, month: string): string {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 2);
  if (digits === '') return '';
  const number = Number(digits);
  if (number < 1) return '';
  return number > daysInMonth(month) ? digits.slice(0, 1) : digits;
}

export function clampDay(day: string, month: string): string {
  if (day === '') return '';
  return Number(day) > daysInMonth(month) ? String(daysInMonth(month)) : day;
}
