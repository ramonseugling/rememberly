import { ChevronDown, ChevronUp } from 'lucide-react';

interface ViewAllDatesButtonProps {
  onClick: () => void;
  expanded: boolean;
}

export const ViewAllDatesButton = ({
  onClick,
  expanded,
}: ViewAllDatesButtonProps) => {
  const Icon = expanded ? ChevronUp : ChevronDown;
  const label = expanded ? 'Ver menos datas' : 'Ver todas as datas';

  return (
    <div className="flex justify-center mt-4">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-5 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-smooth"
      >
        <span>{label}</span>
        <Icon className="w-4 h-4" />
      </button>
    </div>
  );
};
