import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const STEPS = [
  {
    number: 1,
    icon: '/images/icons/group.png',
    alt: 'Grupo de pessoas',
    title: 'Grupos com amigos',
    description:
      'Crie um grupo, convide seus amigos e nunca mais ninguém vai esquecer o aniversário de ninguém.',
  },
  {
    number: 2,
    icon: '/images/icons/bell.png',
    alt: 'Sino de notificação',
    title: 'Lembretes no dia',
    description:
      'Receba um e-mail no dia do aniversário — simples, direto, sem desculpa para esquecer.',
  },
  {
    number: 3,
    icon: '/images/icons/calendar.png',
    alt: 'Calendário',
    title: 'Fortaleça conexões',
    description:
      'Pequenos gestos criam grandes laços. Esteja presente nas datas que importam.',
  },
];

export const HowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="section-screen relative bg-landing flex flex-col justify-center overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute top-20 right-8 hidden h-32 w-32 bg-dots-pattern opacity-60 lg:block"
      />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-10 lg:py-14">
        <div className="text-center mb-10 lg:mb-12">
          <span className="pill-brand mb-5">
            <span className="pill-brand-text">Como funciona</span>
          </span>
          <h2 className="text-section-title font-heading font-bold tracking-tight mb-4 pb-2">
            <span className="block text-foreground">
              Simples, direto e feito
            </span>
            <span className="block text-brand-gradient">para amigos</span>
          </h2>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-muted-foreground">
            Tudo o que você precisa para nunca mais passar em branco num
            aniversário
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-[14px] left-[16.66%] right-[16.66%] border-t-2 border-dashed z-10"
            style={{ borderColor: 'hsla(340, 80%, 65%, 0.5)' }}
          />

          {STEPS.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative pt-[18px]"
            >
              <span
                aria-label={`Passo ${step.number}`}
                className="step-badge absolute top-0 left-1/2 -translate-x-1/2 z-20"
              >
                {step.number}
              </span>
              <div
                className="rounded-3xl shadow-soft h-full flex flex-col pb-[4px]"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(340, 80%, 65%), hsl(25, 90%, 65%))',
                }}
              >
                <div className="rounded-t-3xl rounded-b-[20px] bg-card flex-1 flex flex-col items-center text-center p-8 pt-12">
                  <div className="mb-6">
                    <Image
                      src={step.icon}
                      alt={step.alt}
                      width={140}
                      height={140}
                      className="mx-auto"
                    />
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
