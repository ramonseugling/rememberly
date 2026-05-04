import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MobileMenuSheet } from '@/components/app-header/mobile-menu-sheet';

interface AppHeaderUser {
  id: string;
  name: string;
  email: string;
}

interface AppHeaderProps {
  user: AppHeaderUser;
}

const NOTIFICATION_BADGE = 2;

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const AppHeader = ({ user }: AppHeaderProps) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = getInitials(user.name);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/v1/sessions', { method: 'DELETE' });
      router.push('/');
    } finally {
      setLoggingOut(false);
      setPopoverOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <Image src="/logo.svg" alt="Rememberly" width={32} height={32} />
            <span className="text-xl font-heading font-bold text-brand-gradient inline-block">
              rememberly
            </span>
          </Link>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Buscar"
              disabled
              className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/40 cursor-not-allowed"
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label="Notificações"
              disabled
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/40 cursor-not-allowed"
            >
              <Bell className="h-5 w-5" />
            </button>

            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition-smooth"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full gradient-warm text-white text-xs font-semibold">
                    {initials}
                  </span>
                  <span className="hidden sm:inline text-sm font-medium text-foreground">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="hidden sm:inline h-4 w-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2" sideOffset={8}>
                <div className="px-3 py-2 border-b border-border/50 mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setPopoverOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-smooth"
                >
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-smooth disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
                </button>
              </PopoverContent>
            </Popover>

            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenuSheet
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
};
