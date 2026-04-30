import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Heart,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const BENEFITS = [
  {
    icon: Users,
    iconBg: 'bg-primary/10 text-primary',
    title: 'Grátis para começar',
    description: 'Crie seus grupos e adicione aniversários sem pagar nada.',
  },
  {
    icon: Zap,
    iconBg: 'bg-secondary/15 text-secondary',
    title: 'Em menos de 1 minuto',
    description: 'Configure tudo rapidinho e convide seus amigos.',
  },
  {
    icon: Heart,
    iconBg: 'bg-emerald-100 text-emerald-600',
    title: 'Fortaleça conexões',
    description: 'Pequenos gestos criam grandes laços.',
  },
];

export const CtaSection = () => {
  return (
    <section className="relative overflow-hidden bg-landing py-20 lg:py-28">
      <div
        aria-hidden="true"
        className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[36rem] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative">
        <div className="text-center mb-12">
          <span className="pill-brand mb-5">
            <span className="pill-brand-text">Pronto para começar?</span>
          </span>
          <h2 className="font-heading font-bold tracking-tight leading-[1.05] text-4xl sm:text-5xl lg:text-6xl mb-4 pb-2">
            <span className="block text-foreground">Comece agora e nunca</span>
            <span className="block text-brand-gradient pb-2">
              mais esqueça ninguém
            </span>
          </h2>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-muted-foreground">
            Junte-se a milhares de pessoas que já transformaram a forma de
            lembrar e serem lembradas.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-card/80 backdrop-blur-md shadow-soft p-6 sm:p-10"
        >
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
            <ul className="space-y-6">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title} className="flex items-start gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${benefit.iconBg}`}
                  >
                    <benefit.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-2xl bg-landing border border-border/60 p-6 sm:p-8 text-center">
              <div role="img" aria-hidden="true" className="text-5xl mb-4">
                🎉
              </div>
              <h3 className="font-heading font-bold text-2xl text-foreground mb-2">
                Crie sua conta gratuita
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                e comece a lembrar com quem realmente importa
              </p>
              <Link href="/signup" className="block">
                <Button
                  size="lg"
                  className="w-full gradient-brand text-white shadow-warm text-base px-6 py-6 rounded-full transition-smooth hover:scale-[1.02] hover:opacity-95"
                >
                  Começar agora, é grátis!
                  <ChevronRight className="ml-1.5 h-5 w-5" />
                </Button>
              </Link>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Sem cartão de crédito. Sem complicação.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
