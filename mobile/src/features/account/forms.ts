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
    throw new Error('Informe um nome entre 2 e 100 caracteres.');
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
        throw new Error(
          'A data de nascimento já cadastrada não pode ser removida.',
        );
      }
      continue;
    }
    if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > max) {
      const label = field === 'day' ? 'dia' : field === 'month' ? 'mês' : 'ano';
      throw new Error(
        `Informe um ${label} de nascimento entre ${min} e ${max}.`,
      );
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
  mothers_day: 'Dia das Mães',
  fathers_day: 'Dia dos Pais',
  valentines_day: 'Dia dos Namorados',
  childrens_day: 'Dia das Crianças',
  christmas: 'Natal',
};

export function occasionLabel(item: Pick<Occasion, 'key' | 'label'>): string {
  return Object.hasOwn(occasionNames, item.key)
    ? occasionNames[item.key]
    : item.label || item.key;
}

export function civilDateLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const month = Number(match[2]);
  return month >= 1 && month <= 12
    ? `${match[3]}/${match[2]}/${match[1]}`
    : value;
}

export function daysUntilLabel(days: number): string {
  return days === 0 ? 'Hoje! 🎉' : `Em ${days} ${days === 1 ? 'dia' : 'dias'}`;
}
