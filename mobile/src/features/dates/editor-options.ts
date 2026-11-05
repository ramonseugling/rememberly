export function dayOptions(month: string) {
  if (!/^(?:[1-9]|1[0-2])$/.test(month)) return [];
  return Array.from(
    { length: new Date(2000, Number(month), 0).getDate() },
    (_, index) => ({ value: String(index + 1), label: String(index + 1) }),
  );
}
