import { Cake, Calendar, Gift, Heart, PartyPopper, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EVENT_TYPES } from '@/lib/constants';
import type { EventType } from '@/lib/types';

interface DateCardProps {
  title: string;
  type: EventType;
  customType?: string | null;
  date: string;
  daysUntil: number;
  groupName?: string;
  onClick?: () => void;
}

export const DateCard = ({
  title,
  type,
  customType,
  date,
  daysUntil,
  groupName,
  onClick,
}: DateCardProps) => {
  const getIcon = () => {
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

  const getGradient = () => {
    if (daysUntil <= 7) return 'gradient-warm';
    if (daysUntil <= 30) return 'gradient-sunset';
    return 'bg-card';
  };

  const getTypeLabel = () =>
    type === 'custom' && customType
      ? customType
      : (EVENT_TYPES.find((t) => t.value === type)?.label ?? type);

  const getDaysText = () => {
    if (daysUntil === 0) return 'Hoje! 🎉';
    if (daysUntil === 1) return 'Amanhã';
    if (daysUntil <= 7) return `Em ${daysUntil} dias`;
    return `${daysUntil} dias`;
  };

  const isUrgent = daysUntil <= 7;

  return (
    <Card
      className={`rounded-3xl border-border/50 overflow-hidden transition-smooth hover:scale-[1.02] hover:shadow-glow cursor-pointer animate-fade-in ${
        isUrgent ? 'ring-2 ring-primary/20' : ''
      }`}
      onClick={onClick}
    >
      <div className={`p-6 ${isUrgent ? getGradient() : 'bg-card'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isUrgent
                  ? 'bg-white/20 text-white'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {getIcon()}
            </div>
            <div>
              <h3
                className={`font-heading font-semibold text-lg ${
                  isUrgent ? 'text-white' : 'text-foreground'
                }`}
              >
                {title}
              </h3>
              <p
                className={`text-sm ${
                  isUrgent ? 'text-white/80' : 'text-muted-foreground'
                }`}
              >
                {getTypeLabel()}
              </p>
            </div>
          </div>
          <Badge
            variant={isUrgent ? 'default' : 'secondary'}
            className={`rounded-full px-3 py-1 font-semibold ${
              isUrgent
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {getDaysText()}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Calendar
              className={`w-4 h-4 ${isUrgent ? 'text-white/70' : 'text-muted-foreground'}`}
            />
            <span
              className={`text-sm font-medium ${
                isUrgent ? 'text-white/90' : 'text-muted-foreground'
              }`}
            >
              {date}
            </span>
          </div>
          {groupName && (
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${
                isUrgent
                  ? 'bg-white/20 text-white'
                  : 'bg-violet-500/10 text-violet-600'
              }`}
            >
              <Users className="w-3 h-3" />
              <span className="text-xs font-medium">{groupName}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
