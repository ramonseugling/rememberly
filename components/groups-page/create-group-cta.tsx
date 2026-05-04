import { Plus } from 'lucide-react';

interface CreateGroupCtaProps {
  onClick: () => void;
}

export const CreateGroupCta = ({ onClick }: CreateGroupCtaProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 border-dashed border-border/60 p-5 flex items-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-smooth animate-fade-in text-left"
    >
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <Plus className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="font-heading font-semibold text-foreground leading-tight">
          Criar novo grupo
        </p>
        <p className="text-sm text-muted-foreground leading-snug mt-0.5">
          Comece um novo grupo e convide pessoas para compartilhar datas
          importantes.
        </p>
      </div>
    </button>
  );
};
