import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HeaderLandingProps {
  variant?: 'landing' | 'auth';
}

const NAV_LINKS = [
  { href: '#how-it-works', label: 'Como funciona' },
  { href: '#groups', label: 'Grupos' },
];

export const HeaderLanding = ({ variant = 'landing' }: HeaderLandingProps) => {
  const showNav = variant === 'landing';

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/images/brand/logo.svg"
              alt="Rememberly"
              width={40}
              height={40}
              priority
            />
            <span className="font-heading font-bold text-2xl text-brand-gradient">
              Rememberly
            </span>
          </Link>

          {showNav && (
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-smooth"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/login"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-smooth"
              >
                Entrar
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-2">
            <Link href="/signup" className="hidden sm:inline-flex">
              <Button className="gradient-brand text-white rounded-full px-5 py-2 font-semibold hover:opacity-90 transition-smooth shadow-warm text-sm">
                Começar agora
              </Button>
            </Link>
            <Link href="/signup" className="sm:hidden">
              <Button className="gradient-brand text-white rounded-full px-4 py-2 font-semibold hover:opacity-90 transition-smooth text-sm">
                Começar agora
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
