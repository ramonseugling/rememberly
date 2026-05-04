import { useState } from 'react';
import { Cake, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDaysLabel } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export interface BirthdayListEntry {
  id: string;
  name: string;
  date: string;
  weekday: string;
  daysUntil: number;
  isOwner: boolean;
  isYou: boolean;
}

interface BirthdaysListProps {
  entries: BirthdayListEntry[];
}

const PREVIEW_COUNT = 5;

export const BirthdaysList = ({ entries }: BirthdaysListProps) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, PREVIEW_COUNT);
  const hasOverflow = entries.length > PREVIEW_COUNT;

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Ninguém do grupo cadastrou data de aniversário ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/40 bg-card p-5 animate-fade-in">
      <h3 className="font-heading font-semibold text-base text-foreground mb-4">
        Próximos aniversários
      </h3>
      <ul className="flex flex-col">
        {visible.map((entry, index) => {
          const isUrgent = entry.daysUntil <= 7;
          return (
            <li
              key={entry.id}
              className={cn(
                'flex items-center gap-3 py-3',
                index !== visible.length - 1 && 'border-b border-border/30',
              )}
            >
              <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Cake className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground truncate">
                    {entry.name}
                    {entry.isYou && (
                      <span className="text-muted-foreground"> (você)</span>
                    )}
                  </span>
                  {entry.isOwner && (
                    <span className="rounded-full bg-primary/15 text-primary text-[10px] font-semibold px-2 py-0.5">
                      Criador
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {entry.date} ({entry.weekday})
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  isUrgent
                    ? 'bg-primary/15 text-primary'
                    : 'bg-accent/15 text-accent',
                )}
              >
                {formatDaysLabel(entry.daysUntil)}
              </span>
            </li>
          );
        })}
      </ul>

      {hasOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full inline-flex items-center justify-center gap-1 rounded-full border border-border/50 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-smooth"
        >
          {expanded ? 'Ver menos' : 'Ver todas as datas'}
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
};
