import { profileForm, type ProfileForm, type ProfileUser } from './forms.ts';

export const profileMonths = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
].map((label, index) => ({ label, value: String(index + 1) }));

export function profileHasChanges(
  form: ProfileForm,
  user: ProfileUser,
): boolean {
  const original = profileForm(user);
  return (
    form.first_name.trim() !== original.first_name ||
    form.last_name.trim() !== original.last_name ||
    (form.day ? Number(form.day) : null) !== user.birth_day ||
    (form.month ? Number(form.month) : null) !== user.birth_month ||
    (form.year ? Number(form.year) : null) !== user.birth_year
  );
}

export function profileDaysInMonth(month: string): number {
  return (
    [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Number(month) - 1] ?? 31
  );
}

export function profileFieldChange(
  form: ProfileForm,
  field: keyof ProfileForm,
  value: string,
): ProfileForm {
  if (
    field === 'day' &&
    (!/^\d*$/.test(value) ||
      (value !== '' &&
        (Number(value) < 1 || Number(value) > profileDaysInMonth(form.month))))
  )
    return form;
  const changed = {
    ...form,
    [field]: field === 'day' ? value.slice(0, 2) : value,
  };
  if (field === 'month' && Number(changed.day) > profileDaysInMonth(value))
    changed.day = String(profileDaysInMonth(value));
  return changed;
}
