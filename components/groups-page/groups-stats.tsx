import { Calendar, type LucideIcon, Users, UsersRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GroupsStatsProps {
  groupsCount: number;
  membersCount: number;
  upcomingDatesCount: number;
}

interface Stat {
  icon: LucideIcon;
  value: number;
  label: string;
  tone: string;
}

export const GroupsStats = ({
  groupsCount,
  membersCount,
  upcomingDatesCount,
}: GroupsStatsProps) => {
  const stats: Stat[] = [
    {
      icon: Users,
      value: groupsCount,
      label: groupsCount === 1 ? 'Grupo ativo' : 'Grupos ativos',
      tone: 'bg-primary/10 text-primary',
    },
    {
      icon: UsersRound,
      value: membersCount,
      label: membersCount === 1 ? 'Pessoa conectada' : 'Pessoas conectadas',
      tone: 'bg-accent/10 text-accent',
    },
    {
      icon: Calendar,
      value: upcomingDatesCount,
      label: upcomingDatesCount === 1 ? 'Data chegando' : 'Datas chegando',
      tone: 'bg-secondary/10 text-secondary',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in">
      {stats.map(({ icon: Icon, value, label, tone }) => (
        <Card
          key={label}
          className="rounded-2xl border-border/40 p-4 flex items-center gap-3"
        >
          <div
            className={cn(
              'shrink-0 flex h-10 w-10 items-center justify-center rounded-2xl',
              tone,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-heading font-bold text-foreground leading-none">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-tight truncate">
              {label}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};
