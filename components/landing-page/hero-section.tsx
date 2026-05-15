import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, ChevronRight, Gift, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TRUST_SIGNALS = [
  { icon: Users, label: 'Grupos ilimitados' },
  { icon: Bell, label: 'Lembretes inteligentes' },
  { icon: Heart, label: 'Conexões fortalecidas' },
];

export const HeroSection = () => {
  const [isLg, setIsLg] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsLg(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <section className="section-screen relative overflow-x-hidden bg-landing flex flex-col justify-center">
      <div
        aria-hidden="true"
        className="absolute bottom-10 left-4 hidden h-32 w-32 bg-dots-pattern lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 hidden h-96 w-96 rounded-full bg-primary/10 blur-3xl lg:block"
      />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 lg:py-10">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center lg:items-start lg:text-left order-2 lg:order-1"
          >
            <span className="pill-brand mb-6">
              <Gift className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="pill-brand-text">
                Lembretes de aniversário para grupos
              </span>
            </span>

            <h1 className="text-hero font-heading font-bold tracking-tight mb-5">
              <span className="block text-foreground">
                Nunca mais esqueça o
              </span>
              <span className="block text-brand-gradient pb-2">
                aniversário de seus amigos
              </span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
              Crie grupos com amigos e família. Cada pessoa cadastra o próprio
              aniversário e todo mundo recebe lembretes no dia certo.
            </p>

            <Link href="/signup" className="mb-8">
              <Button
                size="lg"
                className="gradient-brand text-white shadow-warm text-base px-8 py-6 rounded-full transition-smooth hover:scale-105 hover:opacity-95"
              >
                Criar meu grupo grátis
                <ChevronRight className="ml-1.5 h-5 w-5" />
              </Button>
            </Link>

            <ul className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3">
              {TRUST_SIGNALS.map((signal) => (
                <li
                  key={signal.label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/30">
                    <signal.icon
                      className="h-3.5 w-3.5 text-primary"
                      aria-hidden="true"
                    />
                  </span>
                  {signal.label}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative order-1 lg:order-2 mx-auto w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[480px] 2xl:max-w-[560px]"
          >
            <motion.div
              animate={isLg ? { y: [0, -12, 0] } : false}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="relative aspect-square w-full"
            >
              <Image
                src="/images/brand/new-3d-logo.png"
                alt="Calendário 3D com símbolo de infinito"
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 80vw"
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
