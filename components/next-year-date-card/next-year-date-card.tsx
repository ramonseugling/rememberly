import { Cake, Calendar, Clock, Gift, Heart, PartyPopper } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EVENT_TYPES } from '@/lib/constants';
import type { EventType } from '@/lib/types';

interface NextYearDateCardProps {
  title: string;
  type: EventType;
  date: string;
  daysUntil: number;
  onClick?: () => void;
}

const getIcon = (type: EventType) => {
  switch (type) {
    case 'birthday':
      return <Cake className="w-5 h-5" />;
    case 'dating_anniversary':
    case 'wedding_anniversary':
      return <Heart className="w-5 h-5" />;
    case 'celebration':
      return <PartyPopper className="w-5 h-5" />;
    default:
      return <Gift className="w-5 h-5" />;
  }
};

export const NextYearDateCard = ({
  title,
  type,
  date,
  daysUntil,
  onClick,
}: NextYearDateCardProps) => {
  const typeLabel = EVENT_TYPES.find((t) => t.value === type)?.label ?? type;

  const daysText = daysUntil === 1 ? 'Amanhã' : `${daysUntil} dias`;

  return (
    <Card
      className="rounded-3xl border-border/30 overflow-hidden transition-smooth hover:scale-[1.02] cursor-pointer animate-fade-in opacity-60 hover:opacity-80"
      onClick={onClick}
    >
      <div className="p-6 bg-muted/40">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-muted-foreground/10 text-muted-foreground">
              {getIcon(type)}
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-muted-foreground">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground/70">{typeLabel}</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 font-semibold bg-muted text-muted-foreground/70"
          >
            {daysText}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-sm font-medium text-muted-foreground/70">
              {date}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Ano que vem</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
