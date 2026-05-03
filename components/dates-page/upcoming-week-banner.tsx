import { ChevronRight, PartyPopper } from 'lucide-react';

interface UpcomingWeekBannerProps {
  count: number;
  onClick: () => void;
}

export const UpcomingWeekBanner = ({
  count,
  onClick,
}: UpcomingWeekBannerProps) => {
  if (count <= 0) return null;

  const dataLabel = count === 1 ? 'data' : 'datas';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-3xl border border-primary/20 bg-primary/5 px-4 py-3 text-left transition-smooth hover:bg-primary/10 mb-6"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
        aria-hidden
      >
        <PartyPopper className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">
          Você tem {count} {dataLabel} nos próximos 7 dias
        </p>
        <p className="text-xs text-muted-foreground leading-tight mt-0.5">
          Prepare-se para celebrar!
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
};
