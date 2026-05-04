import Image from 'next/image';
import Link from 'next/link';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/images/brand/logo.svg"
              alt="Rememberly"
              width={28}
              height={28}
            />
            <span className="font-heading font-bold text-xl text-brand-gradient">
              Rememberly
            </span>
          </Link>

          <p className="text-xs text-muted-foreground order-last sm:order-none">
            © {new Date().getFullYear()} Rememberly. Todos os direitos
            reservados.
          </p>

          <nav className="flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-primary transition-smooth"
            >
              Como funciona
            </a>
            <a
              href="#groups"
              className="text-sm text-muted-foreground hover:text-primary transition-smooth"
            >
              Grupos
            </a>
            <a
              href="mailto:ramonseugling@gmail.com"
              className="text-sm text-muted-foreground hover:text-primary transition-smooth"
            >
              Contato
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};
