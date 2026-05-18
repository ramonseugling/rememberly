import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Calendar,
  ChevronRight,
  HelpCircle,
  type LucideIcon,
  MessageCircle,
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

const secondaryNav: {
  label: string;
  icon: LucideIcon;
  href?: string;
  isActive?: (pathname: string) => boolean;
}[] = [
  {
    label: 'Ajuda',
    icon: HelpCircle,
    href: '/help',
    isActive: (pathname) => pathname === '/help',
  },
];

export const AppSidebar = () => {
  const router = useRouter();

  return (
    <aside className="hidden lg:flex flex-col w-64 sticky top-0 h-screen border-r border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/brand/logo.svg"
            alt="Rememberly"
            width={32}
            height={32}
          />
          <span className="text-2xl font-heading font-bold text-brand-gradient inline-block">
            Rememberly
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
        {secondaryNav.map(({ label, href, icon: Icon, isActive }) => {
          if (href) {
            const active = isActive?.(router.pathname) ?? false;
            return (
              <Link
                key={label}
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
          }

          return (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/80 cursor-default opacity-60"
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <Link
          href="/groups"
          className="w-full flex items-center gap-3 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/10 px-3 py-3 hover:bg-[#25D366]/15 transition-smooth text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              Convide amigos
            </p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              e nunca mais esqueçam um aniversário!
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </Link>
      </div>
    </aside>
  );
};
