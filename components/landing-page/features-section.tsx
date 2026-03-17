import { Card } from '@/components/ui/card';

const features = [
  {
    emoji: '🗓️',
    title: 'Registre datas',
    description:
      'Adicione aniversários, casamentos e todas as datas importantes da sua família e amigos',
  },
  {
    emoji: '🔔',
    title: 'Lembretes',
    description:
      'Receba notificações por e-mail para nunca esquecer uma data especial de quem você ama',
  },
  {
    emoji: '💖',
    title: 'Compartilhe amor',
    description:
      'Mostre carinho lembrando-se de cada aniversário e celebrando momentos únicos',
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-10 sm:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 animate-fade-in">
          Celebre cada momento especial
        </h2>
        <p className="text-center text-muted-foreground text-base sm:text-lg mb-8 sm:mb-16 max-w-xl mx-auto">
          Tudo o que você precisa para nunca deixar passar uma data importante
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map(({ emoji, title, description }, index) => (
            <Card
              key={title}
              className="p-8 text-center hover:shadow-warm transition-all duration-300 hover:-translate-y-2 bg-card border-border/50 animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="mb-6">
                <span
                  role="img"
                  aria-hidden="true"
                  className="text-5xl select-none"
                >
                  {emoji}
                </span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{title}</h3>
              <p className="text-muted-foreground">{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
