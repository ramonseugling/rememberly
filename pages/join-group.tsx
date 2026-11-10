import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getValidUser, isValidNextUrl } from 'infra/page-guard';
import group from 'models/group';

interface JoinGroupProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  code: string;
  groupName: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getValidUser(context);
  const code = context.query.code;

  if (!code || typeof code !== 'string') {
    const destination = user ? '/groups' : '/signup';
    return { redirect: { destination, permanent: false } };
  }

  if (!user) {
    const next = `/join-group?code=${code}`;
    const destination = isValidNextUrl(next)
      ? `/signup?next=${encodeURIComponent(next)}`
      : '/signup';
    return { redirect: { destination, permanent: false } };
  }

  const foundGroup = await group.findByInviteCode(code);

  return {
    props: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url ?? null,
      },
      code,
      groupName: foundGroup?.name ?? '',
    },
  };
};

export default function JoinGroup({ code, groupName }: JoinGroupProps) {
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
          <div className="w-16 h-16 rounded-2xl bg-violet/10 text-violet flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
            {joined
              ? 'Você entrou no grupo! 🎉'
              : groupName
                ? `Convite para o grupo ${groupName}`
                : 'Convite para grupo'}
          </h2>
          <p className="text-muted-foreground">
            {joined
              ? 'Redirecionando para seus grupos...'
              : groupName
                ? `Você foi convidado para entrar no grupo ${groupName}!`
                : 'Você recebeu um convite para entrar em um grupo!'}
          </p>
        </div>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {!joined && (
          <Button
            className="w-full gradient-violet text-white hover:opacity-90 rounded-2xl py-3 font-semibold transition-smooth"
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
