import {
  Cake,
  Calendar,
  Gift,
  Heart,
  MoreVertical,
  PartyPopper,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EVENT_TYPES } from '@/lib/constants';
import { formatDaysLabel } from '@/lib/date-utils';
import type { EventType } from '@/lib/types';
import { cn } from '@/lib/utils';

type AccentTone = 'pink' | 'orange' | 'violet';

interface DateCardProps {
  title: string;
  type: EventType;
  customType?: string | null;
  date: string;
  daysUntil: number;
  groupName?: string;
  variant?: 'default' | 'featured';
  accent?: AccentTone;
  onClick?: () => void;
}

const ACCENT_RING: Record<AccentTone, string> = {
  pink: 'ring-1 ring-primary',
  orange: '',
  violet: '',
};

const AVATAR_TONE: Record<AccentTone, string> = {
  pink: 'bg-primary/10 text-primary',
  orange: 'bg-accent/10 text-accent',
  violet: 'bg-secondary/10 text-secondary',
};

const BADGE_TONE: Record<AccentTone, string> = {
  pink: 'bg-primary/15 text-primary',
  orange: 'bg-accent/15 text-accent',
  violet: 'bg-secondary/15 text-secondary',
};

const getIcon = (type: EventType, size: 'sm' | 'lg') => {
  const className = size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  switch (type) {
    case 'birthday':
      return <Cake className={className} />;
    case 'dating_anniversary':
    case 'wedding_anniversary':
      return <Heart className={className} />;
    case 'celebration':
      return <PartyPopper className={className} />;
    default:
      return <Gift className={className} />;
  }
};

export const DateCard = ({
  title,
  type,
  customType,
  date,
  daysUntil,
  groupName,
  variant = 'default',
  accent = 'pink',
  onClick,
}: DateCardProps) => {
  const typeLabel =
    type === 'custom' && customType
      ? customType
      : (EVENT_TYPES.find((t) => t.value === type)?.label ?? type);

  const daysLabel = formatDaysLabel(daysUntil);
  const isFeatured = variant === 'featured';
  const isUrgent = daysUntil <= 2;

  const handleKebabClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'rounded-2xl overflow-hidden transition-smooth animate-fade-in cursor-pointer',
        isUrgent
          ? 'gradient-warm border-transparent text-white shadow-warm'
          : cn(
              'border-border/40 bg-card hover:shadow-soft',
              ACCENT_RING[accent],
              isFeatured ? 'shadow-soft' : '',
            ),
      )}
    >
      <div className={cn('flex flex-col gap-3', isFeatured ? 'p-5' : 'p-4')}>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'shrink-0 rounded-2xl flex items-center justify-center',
              isUrgent ? 'bg-white/20 text-white' : AVATAR_TONE[accent],
              isFeatured ? 'w-14 h-14' : 'w-11 h-11',
            )}
          >
            {getIcon(type, isFeatured ? 'lg' : 'sm')}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                'font-heading font-semibold leading-tight truncate',
                isUrgent ? 'text-white' : 'text-foreground',
                isFeatured ? 'text-lg' : 'text-base',
              )}
            >
              {title}
            </h3>
            <p
              className={cn(
                'text-sm leading-tight',
                isUrgent ? 'text-white/85' : 'text-muted-foreground',
              )}
            >
              {typeLabel}
            </p>
          </div>

          {onClick && (
            <button
              type="button"
              onClick={handleKebabClick}
              aria-label="Editar evento"
              className={cn(
                'shrink-0 -mr-1 rounded-full p-1 transition-smooth',
                isUrgent
                  ? 'text-white/80 hover:text-white hover:bg-white/15'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {groupName && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
                isUrgent
                  ? 'bg-white/20 text-white'
                  : 'bg-muted/60 text-foreground/90',
              )}
            >
              <Users className="w-3 h-3" />
              <span className="text-xs font-medium">{groupName}</span>
            </span>
          )}

          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium',
              isUrgent ? 'text-white/90' : 'text-muted-foreground',
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            {date}
          </span>

          <span
            className={cn(
              'ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold',
              isUrgent ? 'bg-white/25 text-white' : BADGE_TONE[accent],
            )}
          >
            {daysLabel}
          </span>
        </div>
      </div>
    </Card>
  );
};
