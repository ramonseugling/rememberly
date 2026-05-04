import { useState } from 'react';
import { useRouter } from 'next/router';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LogoutCard = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/v1/sessions', { method: 'DELETE' });
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-6 animate-fade-in">
      <p className="text-sm font-semibold text-foreground mb-1">
        Sair da conta
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        Você será desconectado deste dispositivo. Pode entrar de novo a qualquer
        momento.
      </p>
      <Button
        variant="outline"
        className="border-destructive text-destructive hover:bg-destructive/10 rounded-2xl gap-1.5"
        onClick={handleLogout}
        disabled={isLoading}
      >
        <LogOut className="w-4 h-4" />
        {isLoading ? 'Saindo...' : 'Sair da conta'}
      </Button>
    </div>
  );
};
