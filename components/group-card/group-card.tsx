import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface GroupCardProps {
  name: string;
  role: 'owner' | 'member';
  memberCount: number;
  onClick: () => void;
}

export const GroupCard = ({
  name,
  role,
  memberCount,
  onClick,
}: GroupCardProps) => {
  return (
    <Card
      className="rounded-3xl border-border/50 overflow-hidden transition-smooth hover:scale-[1.02] hover:shadow-glow cursor-pointer animate-fade-in border-l-4 border-l-violet-500"
      onClick={onClick}
    >
      <div className="p-6 bg-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-500/10 text-violet-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-foreground">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
              </p>
            </div>
          </div>
          <Badge
            className={`rounded-full px-3 py-1 font-semibold ${
              role === 'owner'
                ? 'gradient-groups text-white hover:opacity-90'
                : 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20'
            }`}
          >
            {role === 'owner' ? 'Criador' : 'Membro'}
          </Badge>
        </div>
      </div>
    </Card>
  );
};
