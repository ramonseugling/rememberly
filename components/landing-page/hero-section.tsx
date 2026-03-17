import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const eventTypes = [
  {
    label: 'aniversário de amigos',
    gradient: 'linear-gradient(135deg, hsl(340,75%,68%), hsl(280,65%,70%))',
  },
  {
    label: 'aniversário de familiares',
    gradient: 'linear-gradient(135deg, hsl(25,85%,65%), hsl(340,75%,68%))',
  },
  {
    label: 'aniversário de namoro',
    gradient: 'linear-gradient(135deg, hsl(280,65%,70%), hsl(0,70%,65%))',
  },
  {
    label: 'aniversário de casamento',
    gradient: 'linear-gradient(135deg, hsl(340,75%,68%), hsl(25,85%,65%))',
  },
  {
    label: 'celebrações especiais',
    gradient: 'linear-gradient(135deg, hsl(25,85%,65%), hsl(280,65%,70%))',
  },
];

export const HeroSection = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % eventTypes.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative isolate flex min-h-[calc(100dvh-57px)] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 gradient-soft" />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, hsl(340,75%,68%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(25,85%,65%) 0%, transparent 50%)',
        }}
      />

      {/* Floating decorative elements */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="absolute top-[3%] left-[2%] hidden pointer-events-none sm:block md:top-[8%] md:left-[8%] lg:top-[10%] lg:left-[12%]"
      >
        <span
          role="img"
          aria-hidden="true"
          className="text-7xl opacity-40 select-none"
        >
          🎉
        </span>
      </motion.div>
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        className="absolute bottom-[5%] right-[2%] hidden pointer-events-none sm:block md:bottom-[12%] md:right-[8%] lg:bottom-[20%] lg:right-[12%]"
      >
        <span
          role="img"
          aria-hidden="true"
          className="text-7xl opacity-40 select-none"
        >
          🎈
        </span>
      </motion.div>
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        className="absolute top-[5%] right-[2%] hidden pointer-events-none lg:block lg:top-[15%] lg:right-[10%]"
      >
        <span
          role="img"
          aria-hidden="true"
          className="text-7xl opacity-40 select-none"
        >
          🎁
        </span>
      </motion.div>
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut' }}
        className="absolute bottom-[5%] left-[2%] hidden pointer-events-none lg:block lg:bottom-[15%] lg:left-[10%]"
      >
        <span
          role="img"
          aria-hidden="true"
          className="text-7xl opacity-30 select-none"
        >
          🗓️
        </span>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 py-16 text-center sm:py-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur-sm"
        >
          <Sparkles className="h-4 w-4" />
          <span>O seu novo assistente de datas importantes</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex w-full flex-col items-center"
        >
          <h1 className="flex flex-col items-center font-bold tracking-tight leading-tight">
            <span className="mb-2 block text-foreground text-5xl sm:text-6xl lg:text-7xl sm:mb-3">
              Nunca mais esqueça
            </span>
            <div className="relative h-[120px] w-full overflow-hidden sm:h-auto sm:overflow-visible">
              <AnimatePresence mode="wait">
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center text-center text-5xl sm:static sm:block sm:whitespace-nowrap sm:text-6xl lg:text-7xl"
                  style={{
                    background: eventTypes[index].gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {eventTypes[index].label}
                </motion.span>
              </AnimatePresence>
            </div>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-10 max-w-lg text-base font-medium leading-relaxed text-muted-foreground sm:text-xl"
        >
          Ajudamos você a lembrar as datas mais importantes de quem importa para
          você.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link href="/signup">
            <Button
              size="lg"
              className="gradient-warm text-white shadow-warm text-base px-8 py-5 rounded-full transition-smooth hover:scale-105 hover:opacity-90 sm:text-lg sm:px-10 sm:py-6"
            >
              Criar minha conta grátis
              <ChevronRight className="ml-2 h-5 w-5 mt-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
