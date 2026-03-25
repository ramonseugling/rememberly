import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { withAuth } from 'infra/page-guard';

interface JoinGroupProps {
  user: { id: string; name: string; email: string };
  code: string;
}

export const getServerSideProps: GetServerSideProps = withAuth(
  async (context, user) => {
    const code = context.query.code;

    if (!code || typeof code !== 'string') {
      return { redirect: { destination: '/groups', permanent: false } };
    }

    return { props: { user, code } };
  },
);

export default function JoinGroup({ code }: JoinGroupProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message ?? 'Erro ao entrar no grupo.');
        return;
      }

      setJoined(true);
      setTimeout(() => router.push('/groups'), 1500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="rounded-3xl border-border/50 max-w-md w-full p-8 text-center animate-fade-in">
        <div className="mb-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
            {joined ? 'Você entrou no grupo! 🎉' : 'Convite para grupo'}
          </h2>
          <p className="text-muted-foreground">
            {joined
              ? 'Redirecionando para seus grupos...'
              : 'Você recebeu um convite para entrar em um grupo!'}
          </p>
        </div>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {!joined && (
          <Button
            className="w-full gradient-groups text-white hover:opacity-90 rounded-2xl py-3 font-semibold transition-smooth"
            onClick={handleJoin}
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar no grupo'}
          </Button>
        )}
      </Card>
    </div>
  );
}
