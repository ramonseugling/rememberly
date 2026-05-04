import { Cake, ChevronRight } from 'lucide-react';
import { formatDaysLabel } from '@/lib/date-utils';

interface NextBirthdayHighlightProps {
  name: string;
  date: string;
  weekday: string;
  daysUntil: number;
}

export const NextBirthdayHighlight = ({
  name,
  date,
  weekday,
  daysUntil,
}: NextBirthdayHighlightProps) => {
  return (
    <div className="flex-1 rounded-2xl bg-primary/10 p-4 animate-fade-in">
      <p className="text-xs font-medium text-primary mb-2">Próxima data</p>
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
          <Cake className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-base text-foreground truncate leading-tight">
            {name}
          </p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">
            {date} ({weekday})
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/20 text-primary px-3 py-1 text-xs font-semibold">
          {formatDaysLabel(daysUntil)}
        </span>
        <ChevronRight className="shrink-0 w-4 h-4 text-primary/70" />
      </div>
    </div>
  );
};
