import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddEventModal } from '@/components/add-event-modal/add-event-modal';
import { DateCard } from '@/components/date-card/date-card';
import { EmptyState } from '@/components/empty-state/empty-state';
import { HelloCard } from '@/components/hello-card/hello-card';
import { UrgentDateCard } from '@/components/urgent-date-card/urgent-date-card';
import { dates } from '@/mocks/dates';
import session from 'models/session';

interface User {
  id: string;
  name: string;
  email: string;
}

interface HomeProps {
  user?: User | null;
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async (
  context,
) => {
  const token = context.req.cookies?.session_token;

  if (!token) {
    return { props: { user: null } };
  }

  const foundSession = await session.findOneValidByToken(token);

  if (!foundSession) {
    return { props: { user: null } };
  }

  return {
    props: {
      user: {
        id: foundSession.user_id,
        name: foundSession.name,
        email: foundSession.email,
      },
    },
  };
};

export default function Home({ user }: HomeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) {
    return (
      <section className="container mx-auto px-4 py-8">
        <EmptyState showLoginCta />
      </section>
    );
  }

  return (
    <div>
      <section className="container mx-auto px-4 py-8">
        {dates.length > 0 && (
          <>
            <HelloCard name={user.name} />
            <UrgentDateCard />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {dates.map((date, index) => (
                <div
                  key={date.id}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <DateCard
                    name={date.name}
                    type={date.type}
                    date={date.date}
                    daysUntil={date.daysUntil}
                  />
                </div>
              ))}
            </div>
          </>
        )}
        {dates.length === 0 && <EmptyState />}
      </section>
      <Button
        size="lg"
        className="fixed bottom-12 right-8 w-16 h-16 rounded-full gradient-warm text-white shadow-glow hover:opacity-90 transition-smooth hover:scale-110 animate-float"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>
      <AddEventModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
