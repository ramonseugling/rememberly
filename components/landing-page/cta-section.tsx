import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CtaSection = () => {
  return (
    <section className="py-10 sm:py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-soft" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(340,75%,68%) 0%, transparent 70%)',
        }}
      />
      <div className="container mx-auto text-center relative z-10 px-4">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 animate-fade-in">
          Comece agora e nunca mais esqueça
        </h2>
        <p
          className="text-base sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          Seus amigos merecem ser lembrados. Crie sua conta e cadastre os
          aniversários agora.
        </p>
        <Link href="/signup">
          <Button
            size="lg"
            className="gradient-warm text-white shadow-warm text-base px-8 py-5 rounded-full transition-smooth hover:scale-105 hover:opacity-90 animate-fade-in sm:text-lg sm:px-10 sm:py-6"
            style={{ animationDelay: '0.4s' }}
          >
            Criar minha conta grátis
            <ChevronRight className="ml-2 h-5 w-5 mt-1" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
