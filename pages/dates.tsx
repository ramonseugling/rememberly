import { useMemo, useState } from 'react';
import type { GetServerSideProps } from 'next';
import { Cake, Calendar, Clock } from 'lucide-react';
import { AddEventModal } from '@/components/add-event-modal/add-event-modal';
import { DateCard } from '@/components/date-card/date-card';
import { DatesPageHeader } from '@/components/dates-page/dates-page-header';
import { DatesSection } from '@/components/dates-page/dates-section';
import { UpcomingWeekBanner } from '@/components/dates-page/upcoming-week-banner';
import { ViewAllDatesButton } from '@/components/dates-page/view-all-dates-button';
import { EmptyState } from '@/components/empty-state/empty-state';
import { NextYearDateCard } from '@/components/next-year-date-card/next-year-date-card';
import { UpdateEventModal } from '@/components/update-event-modal/update-event-modal';
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
  monthName: string;
}

const LATER_PREVIEW_COUNT = 3;

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

    return {
      props: { user, events, monthName: MONTHS[today.getMonth()] },
    };
  },
);

type CardAccent = 'pink' | 'orange' | 'violet';

function renderCard(
  e: EventCard,
  variant: 'default' | 'featured',
  accent: CardAccent,
  onEdit: (event: EventCard) => void,
) {
  const onClick = e.groupName ? undefined : () => onEdit(e);

  if (e.isNextYear) {
    return (
      <NextYearDateCard
        title={e.title}
        type={e.type}
        customType={e.custom_type}
        date={e.date}
        daysUntil={e.daysUntil}
        groupName={e.groupName}
        accent={accent}
        onClick={onClick}
      />
    );
  }

  return (
    <DateCard
      title={e.title}
      type={e.type}
      customType={e.custom_type}
      date={e.date}
      daysUntil={e.daysUntil}
      groupName={e.groupName}
      variant={variant}
      accent={accent}
      onClick={onClick}
    />
  );
}

export default function Dates({ user, events, monthName }: DatesProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventCard | null>(null);
  const [showAllLater, setShowAllLater] = useState(false);

  const buckets = useMemo(() => {
    return {
      withinWeek: events.filter((e) => e.daysUntil <= 7),
      thisMonth: events.filter((e) => e.daysUntil > 7 && e.daysUntil <= 30),
      later: events.filter((e) => e.daysUntil > 30),
    };
  }, [events]);

  const upcomingCount = buckets.withinWeek.length + buckets.thisMonth.length;
  const laterToShow = showAllLater
    ? buckets.later
    : buckets.later.slice(0, LATER_PREVIEW_COUNT);

  if (events.length === 0) {
    return (
      <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <EmptyState onAddClick={() => setIsAddModalOpen(true)} />
        <AddEventModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
      <DatesPageHeader
        monthName={monthName}
        upcomingCount={upcomingCount}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <UpcomingWeekBanner
        count={buckets.withinWeek.length}
        onClick={() => {
          if (typeof window !== 'undefined') {
            document
              .getElementById('section-within-week')
              ?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {buckets.withinWeek.length > 0 && (
        <div id="section-within-week">
          <DatesSection
            title="Próximos 7 dias"
            icon={Calendar}
            iconColor="text-primary"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buckets.withinWeek.map((e, index) => (
                <div key={e.id} style={{ animationDelay: `${index * 0.05}s` }}>
                  {renderCard(e, 'default', 'pink', setSelectedEvent)}
                </div>
              ))}
            </div>
          </DatesSection>
        </div>
      )}

      {buckets.thisMonth.length > 0 && (
        <DatesSection title="Este mês" icon={Cake} iconColor="text-accent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buckets.thisMonth.map((e, index) => (
              <div key={e.id} style={{ animationDelay: `${index * 0.05}s` }}>
                {renderCard(e, 'default', 'orange', setSelectedEvent)}
              </div>
            ))}
          </div>
        </DatesSection>
      )}

      {buckets.later.length > 0 && (
        <DatesSection
          title="Mais pra frente"
          icon={Clock}
          iconColor="text-secondary"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {laterToShow.map((e, index) => (
              <div key={e.id} style={{ animationDelay: `${index * 0.05}s` }}>
                {renderCard(e, 'default', 'violet', setSelectedEvent)}
              </div>
            ))}
          </div>
          {buckets.later.length > LATER_PREVIEW_COUNT && (
            <ViewAllDatesButton
              expanded={showAllLater}
              onClick={() => setShowAllLater((v) => !v)}
            />
          )}
        </DatesSection>
      )}

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
    </section>
  );
}
