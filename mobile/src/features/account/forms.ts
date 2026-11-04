export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
};

export type ProfileForm = {
  name: string;
  day: string;
  month: string;
  year: string;
};

export function profileForm(user: ProfileUser): ProfileForm {
  return {
    name: user.name,
    day: user.birth_day?.toString() ?? '',
    month: user.birth_month?.toString() ?? '',
    year: user.birth_year?.toString() ?? '',
  };
}

export function profileUpdate(
  form: ProfileForm,
  original: ProfileUser,
  currentYear = new Date().getFullYear(),
): {
  name: string;
  birth_day?: number;
  birth_month?: number;
  birth_year?: number;
} {
  const name = form.name.trim();
  if (name.length < 2 || name.length > 100) {
    throw new Error('Enter a name between 2 and 100 characters.');
  }
  const body: ReturnType<typeof profileUpdate> = { name };
  const fields = [
    ['day', 'birth_day', 1, 31],
    ['month', 'birth_month', 1, 12],
    ['year', 'birth_year', 1900, currentYear],
  ] as const;
  for (const [field, key, min, max] of fields) {
    const raw = form[field].trim();
    if (!raw) {
      if (original[key] !== null) {
        throw new Error(`An existing birth ${field} cannot be removed yet.`);
      }
      continue;
    }
    if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > max) {
      throw new Error(`Enter a birth ${field} between ${min} and ${max}.`);
    }
    body[key] = Number(raw);
  }
  return body;
}

export type Occasion = {
  key: string;
  label: string;
  emoji: string;
  enabled: boolean;
  next_date: string;
  days_until: number;
};

const occasionNames: Record<string, string> = {
  mothers_day: "Mother's Day",
  fathers_day: "Father's Day",
  valentines_day: "Valentine's Day",
  childrens_day: "Children's Day",
  christmas: 'Christmas',
};

export function occasionLabel(item: Pick<Occasion, 'key' | 'label'>): string {
  return Object.hasOwn(occasionNames, item.key)
    ? occasionNames[item.key]
    : item.label || item.key;
}

export function civilDateLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const month = months[Number(match[2]) - 1];
  return month ? `${month} ${Number(match[3])}, ${match[1]}` : value;
}

export function daysUntilLabel(days: number): string {
  return days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`;
}
