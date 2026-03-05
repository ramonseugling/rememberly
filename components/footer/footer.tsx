import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="text-center py-2">
        <Link
          href="https://www.linkedin.com/in/ramon-seugling"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent inline-block">
            Desenvolvido com ❤️ para você nunca esquecer quem ama.
          </span>
        </Link>
      </div>
    </footer>
  );
};
