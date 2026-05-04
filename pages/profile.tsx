import type { GetServerSideProps } from 'next';
import { Mail } from 'lucide-react';
import { LogoutCard } from '@/components/profile-page/logout-card';
import { ProfileForm } from '@/components/profile-page/profile-form';
import { withAuth } from 'infra/page-guard';

interface User {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
}

interface ProfileProps {
  user: User;
}

export const getServerSideProps: GetServerSideProps = withAuth(
  async (_context, user) => {
    return {
      props: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          birth_day: user.birth_day,
          birth_month: user.birth_month,
          birth_year: user.birth_year,
        },
      },
    };
  },
);

export default function Profile({ user }: ProfileProps) {
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 max-w-3xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground leading-tight">
          Meu perfil
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Atualize suas informações pessoais.
        </p>
      </div>

      <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-6 mb-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl sm:text-3xl font-heading font-bold">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-heading font-semibold text-foreground leading-tight truncate">
              {user.name}
            </p>
            <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5 mt-1 truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <ProfileForm user={user} />
        <LogoutCard />
      </div>
    </section>
  );
}
