import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { dates } from '@/mocks/dates';
import { DateCard } from '@/components/date-card/date-card';
import { HelloCard } from '@/components/hello-card/hello-card';
import { UrgentDateCard } from '@/components/urgent-date-card/urgent-date-card';
import { EmptyState } from '@/components/empty-state/empty-state';

export default function Home() {
  return (
    <div>
      <section className="container mx-auto px-4 py-8">
        {dates.length > 0 && (
          <>
            <HelloCard />
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
        onClick={() => alert('Modal para adicionar nova data (em breve!)')}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
