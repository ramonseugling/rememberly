import { Calendar, Heart, Gift, PartyPopper, Cake } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DateCardProps {
  name: string;
  type: 'birthday' | 'anniversary' | 'celebration' | 'other';
  date: string;
  daysUntil: number;
}

export const DateCard = ({ name, type, date, daysUntil }: DateCardProps) => {
  const getIcon = () => {
    switch (type) {
      case 'birthday':
        return <Cake className="w-5 h-5" />;
      case 'anniversary':
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

  const getTypeLabel = () => {
    switch (type) {
      case 'birthday':
        return 'Aniversário';
      case 'anniversary':
        return 'Aniversário de Namoro';
      case 'celebration':
        return 'Comemoração';
      default:
        return 'Outro';
    }
  };

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
                {name}
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

        <div className="flex items-center gap-2 mt-4">
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
      </div>
    </Card>
  );
};
