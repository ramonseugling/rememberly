const steps = [
  {
    step: '1',
    emoji: '🌟',
    title: 'Crie sua conta',
    description:
      'Cadastre-se gratuitamente com nome, e-mail e senha ou Google em segundos',
  },
  {
    step: '2',
    emoji: '🗓️',
    title: 'Adicione as datas',
    description:
      'Registre aniversários, aniversário de namoro, aniversário de casamento e outras celebrações',
  },
  {
    step: '3',
    emoji: '🔔',
    title: 'Receba lembretes',
    description:
      'Todo dia do evento você recebe um e-mail — nunca mais vai esquecer!',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-10 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 animate-fade-in">
          Simples assim
        </h2>
        <p className="text-center text-muted-foreground text-base sm:text-lg mb-16 max-w-xl mx-auto">
          Em três passos você nunca mais esquece um aniversário
        </p>

        <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          {steps.map(({ step, emoji, title, description }, index) => (
            <div
              key={step}
              className="flex flex-col items-center text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 flex items-center justify-center">
                  <span
                    role="img"
                    aria-hidden="true"
                    className="text-5xl select-none"
                  >
                    {emoji}
                  </span>
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {step}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{title}</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
