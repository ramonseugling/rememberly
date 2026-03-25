import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Calendar, LogOut, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileModal } from '@/components/profile-modal/profile-modal';

interface HeaderUser {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
}

interface HeaderProps {
  user?: HeaderUser | null;
}

export const Header = ({ user }: HeaderProps) => {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/v1/sessions', { method: 'DELETE' });
    router.push('/');
  }

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="My Forever Dates"
              width={40}
              height={40}
            />
            <h1 className="text-1xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent inline-block">
              My Forever Dates
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <nav className="flex items-center gap-1 mr-2">
                  <Link href="/dates">
                    <Button
                      variant="link"
                      size="sm"
                      className={`rounded-2xl gap-1.5 ${
                        router.pathname === '/dates'
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline font-[inherit]">
                        Minhas Datas
                      </span>
                    </Button>
                  </Link>
                  <Link href="/groups">
                    <Button
                      variant="link"
                      size="sm"
                      className={`rounded-2xl gap-1.5 ${
                        router.pathname === '/groups' ||
                        router.pathname.startsWith('/groups/')
                          ? 'text-violet-600'
                          : 'text-muted-foreground hover:text-violet-600'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span className="hidden sm:inline font-[inherit]">
                        Grupos
                      </span>
                    </Button>
                  </Link>
                  <Button
                    variant="link"
                    size="sm"
                    className={`rounded-2xl gap-1.5 ${
                      isProfileOpen
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setIsProfileOpen(true)}
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline font-[inherit]">
                      Perfil
                    </span>
                  </Button>
                </nav>
                <Button
                  variant="link"
                  size="icon"
                  className="rounded-2xl hover:bg-destructive/10 hover:text-destructive"
                  title="Sair"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                </Button>

                <ProfileModal
                  user={user}
                  open={isProfileOpen}
                  onOpenChange={setIsProfileOpen}
                />
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
