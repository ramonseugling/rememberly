import Image from 'next/image';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrimaryNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

const primaryNav: PrimaryNavItem[] = [
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

export const AppSidebar = () => {
  const router = useRouter();

  return (
    <aside className="hidden lg:flex flex-col w-64 sticky top-0 h-screen border-r border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Rememberly" width={32} height={32} />
          <span className="text-xl font-heading font-bold text-brand-gradient inline-block">
            rememberly
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {primaryNav.map(({ label, href, icon: Icon, isActive }) => {
          const active = isActive(router.pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-smooth',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/80 hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="my-4 mx-6 border-t border-border/50" />

      <nav className="flex flex-col gap-1 px-3">
        {secondaryNav.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/80 cursor-default opacity-60"
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </div>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/40 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Gift className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              Convide amigos
            </p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              Para usar o Rememberly e ganhe benefícios
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </aside>
  );
};
