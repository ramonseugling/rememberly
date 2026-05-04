import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Calendar,
  ChevronRight,
  Gift,
  HelpCircle,
  type LucideIcon,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMenuSheetProps {
  open: boolean;
  onClose: () => void;
}

const primaryNav: {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    label: 'Minhas Datas',
    href: '/dates',
    icon: Calendar,
    isActive: (pathname) => pathname === '/dates',
  },
  {
    label: 'Grupos',
    href: '/groups',
    icon: Users,
    isActive: (pathname) => pathname.startsWith('/groups'),
  },
  {
    label: 'Perfil',
    href: '/profile',
    icon: User,
    isActive: (pathname) => pathname === '/profile',
  },
];

const secondaryNav: { label: string; icon: LucideIcon }[] = [
  { label: 'Configurações', icon: Settings },
  { label: 'Ajuda', icon: HelpCircle },
];

export const MobileMenuSheet = ({ open, onClose }: MobileMenuSheetProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      <aside className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-float animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <span className="text-lg font-heading font-semibold text-foreground">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-3">
          {primaryNav.map(({ label, href, icon: Icon, isActive }) => {
            const active = isActive(router.pathname);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-smooth',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-5 my-2 border-t border-border/50" />

        <nav className="flex flex-col gap-1 px-3">
          {secondaryNav.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/80 cursor-default opacity-60"
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </div>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/40 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Gift className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Convide amigos
              </p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                Para usar o Rememberly e ganhe benefícios
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </div>
      </aside>
    </div>
  );
};
