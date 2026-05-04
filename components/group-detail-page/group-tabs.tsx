import { Cake, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GroupTab = 'dates' | 'members' | 'configurations';

interface GroupTabsProps {
  active: GroupTab;
  onChange: (tab: GroupTab) => void;
}

const TABS: { id: GroupTab; label: string; icon: typeof Cake }[] = [
  { id: 'dates', label: 'Datas', icon: Cake },
  { id: 'members', label: 'Membros', icon: Users },
  { id: 'configurations', label: 'Configurações', icon: Settings },
];

export const GroupTabs = ({ active, onChange }: GroupTabsProps) => {
  return (
    <div className="flex items-center gap-2 sm:gap-4 border-b border-border/40 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-smooth whitespace-nowrap border-b-2 -mb-px',
              isActive
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground',
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
