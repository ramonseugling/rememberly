import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DatesPageHeaderProps {
  monthName: string;
  upcomingCount: number;
  onAddClick: () => void;
}

export const DatesPageHeader = ({
  monthName,
  upcomingCount,
  onAddClick,
}: DatesPageHeaderProps) => {
  const eventsLabel = upcomingCount === 1 ? 'evento' : 'eventos';

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <p className="text-sm font-semibold text-primary mb-1">Minhas Datas</p>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground leading-tight">
          Próximas datas importantes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {monthName} • {upcomingCount} {eventsLabel} nos próximos 30 dias
        </p>
      </div>

      <Button
        onClick={onAddClick}
        className="hidden lg:inline-flex gradient-warm text-white hover:opacity-90 rounded-2xl gap-2 shrink-0"
      >
        <Plus className="w-4 h-4" />
        Adicionar data
      </Button>
    </div>
  );
};
