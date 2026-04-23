import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GroupEmptyStateProps {
  onCreateClick: () => void;
}

export const GroupEmptyState = ({ onCreateClick }: GroupEmptyStateProps) => {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="mb-6">
        <span role="img" aria-hidden="true" className="text-7xl select-none">
          👥
        </span>
      </div>
      <h3 className="text-2xl font-heading font-semibold mb-2">Nenhum grupo</h3>
      <p className="text-muted-foreground mb-6">
        Crie um grupo, convide seus amigos e nunca mais ninguém vai esquecer o
        aniversário de ninguém!
      </p>
      <Button
        className="gradient-violet text-white hover:opacity-90 rounded-2xl px-8 py-3 font-semibold transition-smooth"
        onClick={onCreateClick}
      >
        <Users className="w-4 h-4 mr-2" />
        Criar grupo
      </Button>
    </div>
  );
};
