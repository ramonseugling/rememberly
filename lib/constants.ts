import type { EventType } from '@/lib/types';

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'birthday', label: 'Aniversário' },
  { value: 'dating_anniversary', label: 'Aniversário de Namoro' },
  { value: 'wedding_anniversary', label: 'Aniversário de Casamento' },
  { value: 'celebration', label: 'Comemoração' },
];

export const MONTHS = [
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

export const DAYS_IN_MONTH: Record<number, number> = {
  1: 31,
  2: 29,
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31,
};
