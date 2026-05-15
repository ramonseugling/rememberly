import { useMemo } from 'react';
import {
  type BirthdayListEntry,
  BirthdaysList,
} from '@/components/group-detail-page/birthdays-list';
import { MonthBirthdaysCount } from '@/components/group-detail-page/month-birthdays-count';
import { NextBirthdayHighlight } from '@/components/group-detail-page/next-birthday-highlight';
import { MONTHS } from '@/lib/constants';
import { getBirthdayInfo } from '@/lib/date-utils';
import type { GroupMemberInfo } from '@/lib/types';

const WEEKDAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

interface DatesTabProps {
  members: GroupMemberInfo[];
  currentUserId: string;
}

interface ComputedEntry extends BirthdayListEntry {
  birthMonth: number;
}

export const DatesTab = ({ members, currentUserId }: DatesTabProps) => {
  const entries = useMemo<ComputedEntry[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return members
      .filter((m) => m.birth_day != null && m.birth_month != null)
      .map((m) => {
        const { daysUntil } = getBirthdayInfo(m.birth_day, m.birth_month);
        const day = m.birth_day as number;
        const month = m.birth_month as number;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + (daysUntil ?? 0));

        return {
          id: m.id,
          name: m.name,
          date: `${day} de ${MONTHS[month - 1]}`,
          weekday: WEEKDAYS[targetDate.getDay()],
          daysUntil: daysUntil ?? 0,
          isOwner: m.role === 'owner',
          isYou: m.id === currentUserId,
          birthMonth: month,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [members, currentUserId]);

  const next = entries[0];

  const monthCount = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    return entries.filter((e) => e.birthMonth === currentMonth).length;
  }, [entries]);

  const nextWeekdayLong = useMemo(() => {
    if (!next) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + next.daysUntil);
    return WEEKDAYS[targetDate.getDay()];
  }, [next]);

  return (
    <div className="flex flex-col gap-6">
      {next && (
        <div className="flex flex-col sm:flex-row gap-4">
          <NextBirthdayHighlight
            name={next.name}
            date={next.date}
            weekday={nextWeekdayLong}
            daysUntil={next.daysUntil}
          />
          <MonthBirthdaysCount count={monthCount} />
        </div>
      )}
      <BirthdaysList entries={entries} />
    </div>
  );
};
