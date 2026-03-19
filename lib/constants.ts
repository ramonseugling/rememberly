import type { EventType } from '@/lib/types';

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'birthday', label: 'Aniversário' },
  { value: 'dating_anniversary', label: 'Aniversário de Namoro' },
  { value: 'wedding_anniversary', label: 'Aniversário de Casamento' },
  { value: 'celebration', label: 'Comemoração' },
  { value: 'custom', label: 'Personalizar...' },
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

export const REMINDER_OPTIONS = [
  { value: '0', label: 'Nenhuma' },
  { value: '1', label: '1 dia antes' },
  { value: '3', label: '3 dias antes' },
  { value: '7', label: '1 semana antes' },
  { value: '15', label: '15 dias antes' },
  { value: '30', label: '30 dias antes' },
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
