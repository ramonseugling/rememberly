import { Bell, Calendar, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
          <Card className="p-8 text-center hover:shadow-warm transition-all duration-300 hover:-translate-y-2 bg-card border-border/50 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-6 gradient-warm rounded-2xl flex items-center justify-center shadow-soft">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Registre datas</h3>
            <p className="text-muted-foreground">
              Adicione aniversários, casamentos e todas as datas importantes da
              sua família e amigos
            </p>
          </Card>

          <Card
            className="p-8 text-center hover:shadow-warm transition-all duration-300 hover:-translate-y-2 bg-card border-border/50 animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-16 h-16 mx-auto mb-6 gradient-warm rounded-2xl flex items-center justify-center shadow-soft">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Lembretes</h3>
            <p className="text-muted-foreground">
              Receba notificações por e-mail para nunca esquecer uma data
              especial de quem você ama
            </p>
          </Card>

          <Card
            className="p-8 text-center hover:shadow-warm transition-all duration-300 hover:-translate-y-2 bg-card border-border/50 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="w-16 h-16 mx-auto mb-6 gradient-warm rounded-2xl flex items-center justify-center shadow-soft">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Compartilhe amor</h3>
            <p className="text-muted-foreground">
              Mostre carinho lembrando-se de cada aniversário e celebrando
              momentos únicos
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
