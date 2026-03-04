import type { EventType } from '@/lib/types';

interface MockDate {
  id: number;
  name: string;
  type: EventType;
  date: string;
  daysUntil: number;
}

export const dates: MockDate[] = [
  {
    id: 1,
    name: 'Maria Silva',
    type: 'birthday',
    date: '15 de Janeiro',
    daysUntil: 3,
  },
  {
    id: 2,
    name: 'João Pedro',
    type: 'birthday',
    date: '18 de Janeiro',
    daysUntil: 6,
  },
  {
    id: 3,
    name: 'Aniversário de Namoro',
    type: 'dating_anniversary',
    date: '25 de Janeiro',
    daysUntil: 13,
  },
  {
    id: 4,
    name: 'Ana Costa',
    type: 'birthday',
    date: '02 de Fevereiro',
    daysUntil: 21,
  },
  {
    id: 5,
    name: 'Festa de Formatura',
    type: 'celebration',
    date: '10 de Fevereiro',
    daysUntil: 29,
  },
];
