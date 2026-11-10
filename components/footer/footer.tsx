import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="text-center py-2 px-4 sm:px-0">
        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent inline-block">
          Desenvolvido para você nunca mais esquecer um aniversário.
        </span>
        <nav className="mt-1 flex justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/termos" className="hover:text-primary">
            Termos
          </Link>
          <Link href="/privacidade" className="hover:text-primary">
            Privacidade
          </Link>
        </nav>
      </div>
    </footer>
  );
};
