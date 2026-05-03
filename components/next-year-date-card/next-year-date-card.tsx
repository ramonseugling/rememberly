import {
  Cake,
  Calendar,
  Clock,
  Gift,
  Heart,
  MoreVertical,
  PartyPopper,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EVENT_TYPES } from '@/lib/constants';
import type { EventType } from '@/lib/types';
import { cn } from '@/lib/utils';

type AccentTone = 'pink' | 'orange' | 'violet';

interface NextYearDateCardProps {
  title: string;
  type: EventType;
  customType?: string | null;
  date: string;
  daysUntil: number;
  groupName?: string;
  accent?: AccentTone;
  onClick?: () => void;
}

const ACCENT_RING: Record<AccentTone, string> = {
  pink: 'ring-1 ring-primary',
  orange: '',
  violet: '',
};

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
  customType,
  date,
  daysUntil,
  groupName,
  accent = 'violet',
  onClick,
}: NextYearDateCardProps) => {
  const typeLabel =
    type === 'custom' && customType
      ? customType
      : (EVENT_TYPES.find((t) => t.value === type)?.label ?? type);

  const daysText = daysUntil === 1 ? 'Amanhã' : `${daysUntil} dias`;

  const handleKebabClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'rounded-2xl border-border/30 bg-muted/40 overflow-hidden transition-smooth cursor-pointer animate-fade-in opacity-70 hover:opacity-100',
        ACCENT_RING[accent],
      )}
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-11 h-11 rounded-2xl bg-muted-foreground/10 text-muted-foreground flex items-center justify-center">
            {getIcon(type)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-base text-muted-foreground leading-tight truncate">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground/70 leading-tight">
              {typeLabel}
            </p>
          </div>

          {onClick && (
            <button
              type="button"
              onClick={handleKebabClick}
              aria-label="Editar evento"
              className="shrink-0 -mr-1 rounded-full p-1 text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-smooth"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {groupName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 text-foreground/70 px-2.5 py-0.5">
              <Users className="w-3 h-3" />
              <span className="text-xs font-medium">{groupName}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 text-muted-foreground/70 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {date}
          </span>

          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground/70 px-2.5 py-0.5 text-xs font-semibold">
            <Clock className="w-3 h-3" />
            {daysText}
          </span>
        </div>
      </div>
    </Card>
  );
};
