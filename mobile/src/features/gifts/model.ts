import { ApiError } from '../../data/client.ts';

export interface GiftItem {
  id: string;
  title: string;
  link: string | null;
  description: string | null;
  photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GiftList {
  items: GiftItem[];
  limit: number;
}

export interface GiftForm {
  title: string;
  link: string;
  description: string;
}

export interface GiftPayload {
  title: string;
  link: string | null;
  description: string | null;
}

export type GiftPhotoChange =
  | { kind: 'keep' }
  | { kind: 'set'; data: Uint8Array }
  | { kind: 'remove' };

export function giftFieldsChanged(item: GiftItem, payload: GiftPayload) {
  return (
    item.title !== payload.title ||
    (item.link ?? null) !== payload.link ||
    (item.description ?? null) !== payload.description
  );
}

export const emptyGiftForm: GiftForm = { title: '', link: '', description: '' };

export function formForGift(item?: GiftItem): GiftForm {
  return item
    ? {
        title: item.title,
        link: item.link ?? '',
        description: item.description ?? '',
      }
    : emptyGiftForm;
}

function validLink(link: string) {
  try {
    const url = new URL(link);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function giftPayload(form: GiftForm): {
  payload: GiftPayload | null;
  error: string | null;
} {
  const title = form.title.trim();
  const link = form.link.trim();
  const description = form.description.trim();
  const fail = (error: string) => ({ payload: null, error });
  if (!title) return fail('Informe o nome do presente.');
  if (title.length > 100)
    return fail('O nome do presente deve ter no máximo 100 caracteres.');
  if (link && (link.length > 2000 || !validLink(link)))
    return fail('Informe um link que comece com http:// ou https://.');
  if (description.length > 500)
    return fail('A descrição deve ter no máximo 500 caracteres.');
  return {
    payload: { title, link: link || null, description: description || null },
    error: null,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function birthdayCountdown(
  day: number | null,
  month: number | null,
  today: Date,
): { days: number; label: string } | null {
  if (!day || !month) return null;
  const start = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  let next = Date.UTC(today.getFullYear(), month - 1, day);
  if (next < start) next = Date.UTC(today.getFullYear() + 1, month - 1, day);
  const days = Math.round((next - start) / DAY_MS);
  return {
    days,
    label:
      days === 0
        ? 'Hoje é o seu aniversário! 🎉'
        : days === 1
          ? 'Falta 1 dia para o seu aniversário'
          : `Faltam ${days} dias para o seu aniversário`,
  };
}

export type GiftConflict = 'reserved' | 'purchased';

export function giftConflict(error: unknown): GiftConflict | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  return error.reason === 'reserved' || error.reason === 'purchased'
    ? error.reason
    : null;
}

export function giftHost(link: string): string {
  try {
    return new URL(link).host.replace(/^www\./, '');
  } catch {
    return link;
  }
}

export const purchasedMessage =
  'Este presente já foi comprado e não pode ser alterado.';
export const reservedTitle = 'Este presente está reservado';
export const reservedMessage =
  'Alguém reservou este presente. Se continuar, a reserva será cancelada e a pessoa será avisada.';

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

export interface BirthdayCard {
  days: number;
  dateLabel: string;
  age: number | null;
}

export function birthdayCard(
  day: number | null,
  month: number | null,
  year: number | null,
  today: Date,
): BirthdayCard | null {
  const countdown = birthdayCountdown(day, month, today);
  if (!countdown || !day || !month) return null;
  const upcoming = new Date(today.getFullYear(), month - 1, day);
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const turnsIn =
    upcoming >= start ? today.getFullYear() : today.getFullYear() + 1;
  return {
    days: countdown.days,
    dateLabel: `${day} de ${MONTHS[month - 1]}`,
    age: year ? turnsIn - year : null,
  };
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
