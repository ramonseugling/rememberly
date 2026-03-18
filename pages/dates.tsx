import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddEventModal } from '@/components/add-event-modal/add-event-modal';
import { DateCard } from '@/components/date-card/date-card';
import { EmptyState } from '@/components/empty-state/empty-state';
import { HelloCard } from '@/components/hello-card/hello-card';
import { NextYearDateCard } from '@/components/next-year-date-card/next-year-date-card';
import { UpdateEventModal } from '@/components/update-event-modal/update-event-modal';
import { UrgentDateCard } from '@/components/urgent-date-card/urgent-date-card';
import { MONTHS } from '@/lib/constants';
import type { EventType } from '@/lib/types';
import event from 'models/event';
import session from 'models/session';

interface User {
  id: string;
  name: string;
  email: string;
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
}

interface DatesProps {
  user: User;
  events: EventCard[];
}

export const getServerSideProps: GetServerSideProps<DatesProps> = async (
  context,
) => {
  const token = context.req.cookies?.session_token;

  if (!token) {
    return { redirect: { destination: '/', permanent: false } };
  }

  const foundSession = await session.findOneValidByToken(token);

  if (!foundSession) {
    return { redirect: { destination: '/', permanent: false } };
  }

  const user = {
    id: foundSession.user_id,
    name: foundSession.name,
    email: foundSession.email,
  };

  const rawEvents = await event.findAllByUserId(user.id);

  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const events: EventCard[] = rawEvents
    .map(
      (e: {
        id: string;
        title: string;
        type: string;
        custom_type?: string | null;
        event_day: number;
        event_month: number;
      }) => {
        const thisYearDate = new Date(
          todayMidnight.getFullYear(),
          e.event_month - 1,
          e.event_day,
        );
        const isNextYear = thisYearDate < todayMidnight;
        const targetDate = !isNextYear
          ? thisYearDate
          : new Date(
              todayMidnight.getFullYear() + 1,
              e.event_month - 1,
              e.event_day,
            );

        const daysUntil = Math.round(
          (targetDate.getTime() - todayMidnight.getTime()) /
            (1000 * 60 * 60 * 24),
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
        };
      },
    )
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return { props: { user, events } };
};

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
                      onClick={() => setSelectedEvent(e)}
                    />
                  ) : (
                    <DateCard
                      title={e.title}
                      type={e.type}
                      customType={e.custom_type}
                      date={e.date}
                      daysUntil={e.daysUntil}
                      onClick={() => setSelectedEvent(e)}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {events.length === 0 && <EmptyState />}
      </section>
      <Button
        size="lg"
        className="fixed bottom-12 right-8 w-16 h-16 rounded-full gradient-warm text-white shadow-float hover:opacity-90 transition-smooth hover:scale-110 animate-float"
        onClick={() => setIsAddModalOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>
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
