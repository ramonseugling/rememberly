import { useMemo } from 'react';
import {
  type BirthdayListEntry,
  BirthdaysList,
} from '@/components/group-detail-page/birthdays-list';
import { MonthBirthdaysCount } from '@/components/group-detail-page/month-birthdays-count';
import { NextBirthdayHighlight } from '@/components/group-detail-page/next-birthday-highlight';
import { MONTHS } from '@/lib/constants';
import type { GroupMemberInfo } from '@/lib/types';

interface DatesTabProps {
  members: GroupMemberInfo[];
  currentUserId: string;
  currentMonth: number;
}

interface ComputedEntry extends BirthdayListEntry {
  birthMonth: number;
}

export const DatesTab = ({
  members,
  currentUserId,
  currentMonth,
}: DatesTabProps) => {
  const entries = useMemo<ComputedEntry[]>(() => {
    return members
      .filter((m) => m.birth_day != null && m.birth_month != null)
      .map((m) => {
        const day = m.birth_day as number;
        const month = m.birth_month as number;

        return {
          id: m.id,
          name: m.name,
          date: `${day} de ${MONTHS[month - 1]}`,
          weekday: m.weekday,
          daysUntil: m.daysUntil ?? 0,
          isOwner: m.role === 'owner',
          isYou: m.id === currentUserId,
          birthMonth: month,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [members, currentUserId]);

  const next = entries[0];

  const monthCount = useMemo(
    () => entries.filter((e) => e.birthMonth === currentMonth).length,
    [entries, currentMonth],
  );

  const nextWeekdayLong = next ? next.weekday : '';

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
