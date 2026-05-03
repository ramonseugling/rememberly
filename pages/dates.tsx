import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import { AddEventModal } from '@/components/add-event-modal/add-event-modal';
import { DateCard } from '@/components/date-card/date-card';
import { EmptyState } from '@/components/empty-state/empty-state';
import { HelloCard } from '@/components/hello-card/hello-card';
import { NextYearDateCard } from '@/components/next-year-date-card/next-year-date-card';
import { UpdateEventModal } from '@/components/update-event-modal/update-event-modal';
import { UrgentDateCard } from '@/components/urgent-date-card/urgent-date-card';
import { MONTHS } from '@/lib/constants';
import type { EventType } from '@/lib/types';
import { withAuth } from 'infra/page-guard';
import event from 'models/event';
import groupMember from 'models/group-member';

interface User {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
}

interface EventCard {
  id: string;
  title: string;
  type: EventType;
  custom_type?: string | null;
  date: string;
  daysUntil: number;
  isNextYear: boolean;
  event_day: number;
  event_month: number;
  reminder_days_before: number;
  groupName?: string;
}

interface DatesProps {
  user: User;
  events: EventCard[];
}

function computeDaysUntil(
  eventDay: number,
  eventMonth: number,
  todayMidnight: Date,
) {
  const thisYearDate = new Date(
    todayMidnight.getFullYear(),
    eventMonth - 1,
    eventDay,
  );
  const isNextYear = thisYearDate < todayMidnight;
  const targetDate = !isNextYear
    ? thisYearDate
    : new Date(todayMidnight.getFullYear() + 1, eventMonth - 1, eventDay);

  const daysUntil = Math.round(
    (targetDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24),
  );

  return { daysUntil, isNextYear };
}

export const getServerSideProps: GetServerSideProps = withAuth(
  async (_context, user) => {
    const [rawEvents, rawGroupBirthdays] = await Promise.all([
      event.findAllByUserId(user.id),
      groupMember.findAllBirthdaysForUser(user.id),
    ]);

    const today = new Date();
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const personalEvents: EventCard[] = rawEvents.map(
      (e: {
        id: string;
        title: string;
        type: string;
        custom_type?: string | null;
        event_day: number;
        event_month: number;
        reminder_days_before: number;
      }) => {
        const { daysUntil, isNextYear } = computeDaysUntil(
          e.event_day,
          e.event_month,
          todayMidnight,
        );

        return {
          id: e.id,
          title: e.title,
          type: e.type as EventType,
          custom_type: e.custom_type,
          date: `${e.event_day} de ${MONTHS[e.event_month - 1]}`,
          daysUntil,
          isNextYear,
          event_day: e.event_day,
          event_month: e.event_month,
          reminder_days_before: e.reminder_days_before ?? 0,
        };
      },
    );

    const groupBirthdays: EventCard[] = rawGroupBirthdays.map(
      (e: {
        user_id: string;
        title: string;
        event_day: number;
        event_month: number;
        group_name: string;
        group_count: number;
      }) => {
        const { daysUntil, isNextYear } = computeDaysUntil(
          e.event_day,
          e.event_month,
          todayMidnight,
        );

        return {
          id: `group-birthday-${e.user_id}`,
          title: e.title,
          type: 'birthday' as EventType,
          date: `${e.event_day} de ${MONTHS[e.event_month - 1]}`,
          daysUntil,
          isNextYear,
          event_day: e.event_day,
          event_month: e.event_month,
          reminder_days_before: 0,
          groupName:
            e.group_count > 1 ? `${e.group_count} grupos` : e.group_name,
        };
      },
    );

    const events = [...personalEvents, ...groupBirthdays].sort(
      (a, b) => a.daysUntil - b.daysUntil,
    );

    return { props: { user, events } };
  },
);

export default function Dates({ user, events }: DatesProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventCard | null>(null);

  const urgentCount = events.filter((e) => e.daysUntil <= 7).length;
  const currentMonth = new Date().getMonth() + 1;
  const hasCurrentMonthEvents = events.some(
    (e) => e.event_month === currentMonth && !e.isNextYear,
  );

  return (
    <div>
      <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        {events.length > 0 && (
          <>
            <HelloCard
              name={user.name}
              hasCurrentMonthEvents={hasCurrentMonthEvents}
              onAddClick={() => setIsAddModalOpen(true)}
            />
            <UrgentDateCard urgentCount={urgentCount} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.map((e, index) => (
                <div key={e.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  {e.isNextYear ? (
                    <NextYearDateCard
                      title={e.title}
                      type={e.type}
                      customType={e.custom_type}
                      date={e.date}
                      daysUntil={e.daysUntil}
                      groupName={e.groupName}
                      onClick={
                        e.groupName ? undefined : () => setSelectedEvent(e)
                      }
                    />
                  ) : (
                    <DateCard
                      title={e.title}
                      type={e.type}
                      customType={e.custom_type}
                      date={e.date}
                      daysUntil={e.daysUntil}
                      groupName={e.groupName}
                      onClick={
                        e.groupName ? undefined : () => setSelectedEvent(e)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {events.length === 0 && (
          <EmptyState onAddClick={() => setIsAddModalOpen(true)} />
        )}
      </section>

      <AddEventModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      {selectedEvent && (
        <UpdateEventModal
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(open) => {
            if (!open) setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
