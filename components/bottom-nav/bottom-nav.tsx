import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Bell,
  Calendar,
  type LucideIcon,
  Plus,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onAddEventClick: () => void;
  onCreateGroupClick: () => void;
}

interface NavSlot {
  label: string;
  icon: LucideIcon;
  href?: string;
  isActive: (pathname: string) => boolean;
  inactive?: boolean;
}

const leftSlots: NavSlot[] = [
  {
    label: 'Minhas Datas',
    icon: Calendar,
    href: '/dates',
    isActive: (pathname) => pathname === '/dates',
  },
  {
    label: 'Grupos',
    icon: Users,
    href: '/groups',
    isActive: (pathname) => pathname.startsWith('/groups'),
  },
];

const rightSlots: NavSlot[] = [
  {
    label: 'Lembretes',
    icon: Bell,
    isActive: () => false,
    inactive: true,
  },
  {
    label: 'Perfil',
    icon: User,
    href: '/perfil',
    isActive: (pathname) => pathname === '/perfil',
  },
];

export const BottomNav = ({
  onAddEventClick,
  onCreateGroupClick,
}: BottomNavProps) => {
  const router = useRouter();

  const handleFabClick = () => {
    if (router.pathname === '/dates') {
      onAddEventClick();
      return;
    }
    if (router.pathname.startsWith('/groups')) {
      onCreateGroupClick();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border/50 bg-card/90 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-end px-2 pt-2 pb-2">
        {leftSlots.map((slot) => (
          <NavLink key={slot.label} slot={slot} pathname={router.pathname} />
        ))}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleFabClick}
            aria-label="Adicionar"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full gradient-warm text-white shadow-float transition-smooth hover:opacity-90 active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {rightSlots.map((slot) => (
          <NavLink key={slot.label} slot={slot} pathname={router.pathname} />
        ))}
      </div>
    </nav>
  );
};

interface NavLinkProps {
  slot: NavSlot;
  pathname: string;
}

const NavLink = ({ slot, pathname }: NavLinkProps) => {
  const { label, icon: Icon, href, isActive, inactive } = slot;
  const active = isActive(pathname);

  const content = (
    <>
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-medium">{label}</span>
    </>
  );

  const baseClasses = cn(
    'flex flex-col items-center justify-center gap-1 py-1 transition-smooth',
    inactive
      ? 'cursor-default opacity-60 text-muted-foreground'
      : active
        ? 'text-primary'
        : 'text-muted-foreground hover:text-foreground',
  );

  if (inactive || !href) {
    return <div className={baseClasses}>{content}</div>;
  }

  return (
    <Link href={href} className={baseClasses}>
      {content}
    </Link>
  );
};
