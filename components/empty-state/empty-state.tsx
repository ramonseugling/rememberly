import Image from 'next/image';
import Link from 'next/link';
import { Bell, Cake, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Tip, TipsSection } from '@/components/tips-section/tips-section';

interface EmptyStateProps {
  showLoginCta?: boolean;
  onAddClick?: () => void;
}

const TIPS: Tip[] = [
  {
    icon: Cake,
    title: 'Aniversários',
    description: 'Nunca mais esqueça o aniversário de alguém especial.',
  },
  {
    icon: Star,
    title: 'Datas especiais',
    description: 'Adicione casamentos, formaturas e muito mais.',
  },
  {
    icon: Bell,
    title: 'Lembretes automáticos',
    description: 'Receba lembretes no e-mail no momento certo.',
  },
];

export const EmptyState = ({
  showLoginCta = false,
  onAddClick,
}: EmptyStateProps) => {
  const heading = showLoginCta
    ? 'Bem-vindo ao Rememberly!'
    : 'Nenhuma data por aqui ainda';

  const description = showLoginCta
    ? 'Entre na sua conta para ver e gerenciar seus aniversários.'
    : 'Adicione aniversários e outras datas importantes para receber lembretes no momento certo.';

  return (
    <div className="animate-fade-in space-y-10">
      <div className="bg-muted/40 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="w-44 md:w-60 shrink-0">
          <Image
            src="/images/empty-dates-illustration.png"
            alt=""
            width={480}
            height={480}
            priority
            className="w-full h-auto select-none"
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-3">
            {heading}
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {description}
          </p>
          {showLoginCta ? (
            <Link href="/login">
              <Button className="gradient-warm text-white rounded-full px-6 py-3 font-semibold hover:opacity-90 transition-smooth">
                Entrar na minha conta
              </Button>
            </Link>
          ) : (
            onAddClick && (
              <Button
                onClick={onAddClick}
                className="gradient-warm text-white rounded-full px-6 py-3 font-semibold hover:opacity-90 transition-smooth"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeira data
              </Button>
            )
          )}
        </div>
      </div>

      {!showLoginCta && (
        <TipsSection title="Dicas para aproveitar a Rememberly" tips={TIPS} />
      )}
    </div>
  );
};
