import { isAtLeastAge, MIN_AGE } from './age.ts';

export type ProfileUser = {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
  avatar_url?: string | null;
  has_password?: boolean;
};

export type ProfileForm = {
  first_name: string;
  last_name: string;
  day: string;
  month: string;
  year: string;
};

export function splitName(fullName: string) {
  const [first = '', ...rest] = fullName.trim().split(/\s+/);
  return { first_name: first, last_name: rest.join(' ') };
}

export function profileForm(user: ProfileUser): ProfileForm {
  const names =
    user.first_name != null
      ? { first_name: user.first_name, last_name: user.last_name ?? '' }
      : splitName(user.name);
  return {
    ...names,
    day: user.birth_day?.toString() ?? '',
    month: user.birth_month?.toString() ?? '',
    year: user.birth_year?.toString() ?? '',
  };
}

export function profileUpdate(
  form: ProfileForm,
  original: ProfileUser,
  currentYear = new Date().getFullYear(),
  today = new Date(),
): {
  first_name: string;
  last_name: string;
  birth_day?: number;
  birth_month?: number;
  birth_year?: number;
} {
  const first_name = form.first_name.trim();
  const last_name = form.last_name.trim();
  if (first_name.length < 1 || first_name.length > 60) {
    throw new Error('Informe um nome com até 60 caracteres.');
  }
  if (last_name.length > 60) {
    throw new Error('O sobrenome pode ter até 60 caracteres.');
  }
  const body: ReturnType<typeof profileUpdate> = { first_name, last_name };
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
  const day = body.birth_day ?? original.birth_day;
  const month = body.birth_month ?? original.birth_month;
  const year = body.birth_year ?? original.birth_year;
  if (day && month && !isAtLeastAge({ day, month, year }, MIN_AGE, today)) {
    throw new Error('É preciso ter 12 anos ou mais para usar o Rememberly.');
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
