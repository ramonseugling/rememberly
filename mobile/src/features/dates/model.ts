export const eventTypes = [
  { value: 'birthday', label: 'Aniversário' },
  { value: 'dating_anniversary', label: 'Aniversário de namoro' },
  { value: 'wedding_anniversary', label: 'Aniversário de casamento' },
  { value: 'celebration', label: 'Celebração' },
  { value: 'custom', label: 'Personalizado' },
] as const;
export type EventType = (typeof eventTypes)[number]['value'];
export const reminderDays = [0, 1, 3, 7, 15, 30] as const;

export interface AgendaItem {
  id: string;
  source:
    | { kind: 'personal_event'; event_id: string }
    | {
        kind: 'group_birthday';
        user_id: string;
        group_name: string;
        group_count: number;
      };
  title: string;
  type: EventType;
  custom_type: string | null;
  event_day: number;
  event_month: number;
  reminder_days_before: number | null;
  next_date: string;
  days_until: number;
  is_next_year: boolean;
  avatar_url?: string | null;
  can_edit: boolean;
}

export interface Agenda {
  today: string;
  time_zone: string;
  items: AgendaItem[];
}

export interface EventForm {
  title: string;
  type: EventType;
  customType: string;
  day: string;
  month: string;
  reminder: number;
}

export interface EventPayload {
  title: string;
  type: EventType;
  custom_type: string | null;
  event_day: number;
  event_month: number;
  reminder_days_before: number;
}

export function editableEventId(item: AgendaItem): string | null {
  return item.can_edit && item.source.kind === 'personal_event'
    ? item.source.event_id
    : null;
}

export function formForEvent(item?: AgendaItem): EventForm {
  return item
    ? {
        title: item.title,
        type: item.type,
        customType: item.custom_type ?? '',
        day: String(item.event_day),
        month: String(item.event_month),
        reminder: item.reminder_days_before ?? 0,
      }
    : {
        title: '',
        type: 'birthday',
        customType: '',
        day: '',
        month: '',
        reminder: 0,
      };
}

export function eventPayload(
  form: EventForm,
): { payload: EventPayload; error: null } | { payload: null; error: string } {
  const title = form.title.trim();
  const customType = form.customType.trim();
  if (!title || title.length > 200) {
    return {
      payload: null,
      error: 'Informe um título com 1 a 200 caracteres.',
    };
  }
  if (!eventTypes.some((type) => type.value === form.type)) {
    return { payload: null, error: 'Selecione um tipo de data.' };
  }
  if (form.type === 'custom' && (!customType || customType.length > 100)) {
    return {
      payload: null,
      error: 'Informe um tipo personalizado com 1 a 100 caracteres.',
    };
  }
  if (
    !/^\d{1,2}$/.test(form.day) ||
    Number(form.day) < 1 ||
    Number(form.day) > 31
  ) {
    return { payload: null, error: 'Selecione um dia de 1 a 31.' };
  }
  if (
    !/^\d{1,2}$/.test(form.month) ||
    Number(form.month) < 1 ||
    Number(form.month) > 12
  ) {
    return { payload: null, error: 'Selecione um mês de 1 a 12.' };
  }
  if (!reminderDays.some((days) => days === form.reminder)) {
    return { payload: null, error: 'Selecione uma antecedência válida.' };
  }
  return {
    payload: {
      title,
      type: form.type,
      custom_type: form.type === 'custom' ? customType : null,
      event_day: Number(form.day),
      event_month: Number(form.month),
      reminder_days_before: form.reminder,
    },
    error: null,
  };
}

export function eventTypeLabel(item: AgendaItem): string {
  return item.type === 'custom'
    ? (item.custom_type ?? 'Personalizado')
    : (eventTypes.find((type) => type.value === item.type)?.label ?? item.type);
}

export function reminderLabel(days: number): string {
  return days === 0
    ? 'Nenhuma'
    : `${days} ${days === 1 ? 'dia' : 'dias'} antes`;
}

export function occurrenceLabel(item: AgendaItem): string {
  const [year, month, day] = item.next_date.split('-');
  return `${day}/${month}/${year} · ${
    item.days_until === 0
      ? 'Hoje!'
      : item.days_until === 1
        ? 'Amanhã'
        : `Em ${item.days_until} dias`
  }`;
}

export const monthNames = [
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
] as const;

export function daysLabel(days: number): string {
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
