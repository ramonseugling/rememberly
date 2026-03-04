import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  user?: { name: string; email: string } | null;
}

export const Header = ({ user }: HeaderProps) => {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/v1/sessions', { method: 'DELETE' });
    router.reload();
  }

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-1xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent inline-block">
              My Forever Dates
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button
                  variant="link"
                  size="icon"
                  className="rounded-2xl hover:bg-destructive/10 hover:text-destructive"
                  title="Perfil"
                >
                  <User className="w-5 h-5" />
                </Button>
                <Button
                  variant="link"
                  size="icon"
                  className="rounded-2xl hover:bg-destructive/10 hover:text-destructive"
                  title="Sair"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button className="gradient-warm text-white rounded-2xl px-5 py-2 font-semibold hover:opacity-90 transition-smooth text-sm">
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
