import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GroupsPageHeaderProps {
  onCreateClick: () => void;
}

export const GroupsPageHeader = ({ onCreateClick }: GroupsPageHeaderProps) => {
  return (
    <div className="mb-6 animate-fade-in flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground leading-tight">
          Meus grupos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize aniversários compartilhados com amigos, família e colegas.
        </p>
      </div>
      <Button
        className="gradient-warm text-white hover:opacity-90 rounded-2xl gap-2 self-start sm:self-auto shadow-warm"
        onClick={onCreateClick}
      >
        <Plus className="w-4 h-4" />
        Criar grupo
      </Button>
    </div>
  );
};
