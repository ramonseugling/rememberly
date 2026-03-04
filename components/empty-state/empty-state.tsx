import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  showLoginCta?: boolean;
}

export const EmptyState = ({ showLoginCta = false }: EmptyStateProps) => {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-muted flex items-center justify-center">
        <Calendar className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-heading font-semibold mb-2">
        {showLoginCta
          ? 'Bem-vindo ao My Forever Dates!'
          : 'Nenhuma data cadastrada'}
      </h3>
      <p className="text-muted-foreground mb-6">
        {showLoginCta
          ? 'Entre na sua conta para ver e gerenciar suas datas importantes.'
          : 'Comece adicionando as datas importantes para você!'}
      </p>
      {showLoginCta && (
        <Link href="/login">
          <Button className="gradient-warm text-white rounded-2xl px-8 py-3 font-semibold hover:opacity-90 transition-smooth">
            Entrar na minha conta
          </Button>
        </Link>
      )}
    </div>
  );
};
