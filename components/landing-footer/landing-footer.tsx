import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

const FOOTER_COLUMNS = [
  {
    title: 'Produto',
    links: [
      { label: 'Como funciona', href: '#how-it-works' },
      { label: 'Grupos', href: '#groups' },
      { label: 'Benefícios', href: '#how-it-works' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nós', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Contato', href: '#' },
      { label: 'Carreiras', href: '#' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { label: 'Central de ajuda', href: '#' },
      { label: 'Privacidade', href: '#' },
      { label: 'Termos de uso', href: '#' },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

export const LandingFooter = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
              <Image src="/logo.svg" alt="rememberly" width={36} height={36} />
              <span className="font-heading font-bold text-2xl text-brand-gradient">
                rememberly
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              O jeito mais simples de lembrar e ser lembrado.
            </p>
            <ul className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
                  >
                    <social.icon className="w-4 h-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="font-heading font-bold text-foreground mb-4">
                {column.title}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-smooth"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} rememberly. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
