import type { ReactNode } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bell, ShieldCheck, Users } from 'lucide-react';

const TRUST_SIGNALS = [
  { icon: Users, label: 'Feito para grupos', sub: 'Amigos, família e times' },
  {
    icon: Bell,
    label: 'Lembretes no dia certo',
    sub: 'Você e todos lembrados',
  },
  {
    icon: ShieldCheck,
    label: 'Privado e seguro',
    sub: 'Seus dados protegidos',
  },
];

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthShell = ({ title, subtitle, children }: AuthShellProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-landing">
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-6xl grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:flex flex-col items-start"
          >
            <div className="relative w-full max-w-md">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: 'easeInOut',
                }}
                className="relative aspect-square w-full max-w-sm"
              >
                <Image
                  src="/images/brand/inverted-new-3d-logo.png"
                  alt="Calendário 3D"
                  fill
                  priority
                  sizes="(min-width: 1024px) 30vw, 80vw"
                  className="object-contain"
                />
              </motion.div>

              <motion.span
                animate={{ y: [0, -8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 3.5,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
                aria-hidden="true"
                className="absolute -top-6 -left-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-soft"
              >
                <Image
                  src="/images/icons/bell.png"
                  alt="Bell"
                  width={36}
                  height={36}
                />
              </motion.span>

              <motion.span
                animate={{ y: [0, -10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 4.5,
                  ease: 'easeInOut',
                  delay: 1,
                }}
                aria-hidden="true"
                className="absolute top-8 -right-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-soft"
              >
                <Image
                  src="/images/icons/group.png"
                  alt="Grupos"
                  width={36}
                  height={36}
                />
              </motion.span>
            </div>

            <h2 className="mt-1 font-heading font-bold tracking-tight leading-[1.05] text-4xl xl:text-5xl">
              <span className="block text-foreground">Nunca mais esqueça</span>
              <span className="block text-brand-gradient pb-2">
                quem importa
              </span>
            </h2>
            <ul className="mt-8 flex items-start gap-6">
              {TRUST_SIGNALS.map((signal) => (
                <li key={signal.label} className="flex items-start gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <signal.icon
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">
                      {signal.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {signal.sub}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md mx-auto lg:max-w-none"
          >
            <div className="rounded-3xl border border-border/60 bg-card shadow-soft p-6 sm:p-10">
              <div className="text-center mb-6">
                <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-2">
                  {title}
                </h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              {children}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
