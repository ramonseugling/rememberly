import Link from 'next/link';
import { Bell, Calendar, Gift, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  return (
    <section className="relative min-h-[calc(100vh-57px)] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 gradient-soft" />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, hsl(340,75%,68%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(25,85%,65%) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-fade-in">
          <div className="w-28 h-28 mx-auto mb-8 rounded-3xl gradient-warm flex items-center justify-center shadow-glow animate-float">
            <Heart className="w-14 h-14 text-white" fill="white" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            My Forever Dates
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Nunca mais esqueça aniversários e datas especiais de quem você ama
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button
                size="lg"
                className="gradient-warm text-white shadow-warm text-lg px-8 py-6 rounded-full transition-smooth hover:scale-105 hover:opacity-90"
              >
                <Heart className="mr-2 h-5 w-5" />
                Começar agora
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg px-8 py-6 rounded-full transition-smooth hover:scale-105"
              >
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 animate-pulse">
        <Heart className="w-8 h-8 text-secondary opacity-40" />
      </div>
      <div
        className="absolute top-32 right-16 animate-pulse"
        style={{ animationDelay: '1s' }}
      >
        <Sparkles className="w-10 h-10 text-accent opacity-40" />
      </div>
      <div
        className="absolute bottom-24 left-20 animate-pulse"
        style={{ animationDelay: '2s' }}
      >
        <Calendar className="w-9 h-9 text-primary opacity-40" />
      </div>
      <div
        className="absolute bottom-16 right-24 animate-pulse"
        style={{ animationDelay: '0.5s' }}
      >
        <Gift className="w-7 h-7 text-secondary opacity-40" />
      </div>
    </section>
  );
};
