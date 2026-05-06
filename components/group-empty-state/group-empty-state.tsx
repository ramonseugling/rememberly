import Image from 'next/image';
import { Bell, Cake, Link2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Tip, TipsSection } from '@/components/tips-section/tips-section';

interface GroupEmptyStateProps {
  onCreateClick: () => void;
}

const ORBIT_AVATARS = [
  {
    image: '/images/avatars/pink-avatar.png',
    alt: 'Avatar Ana',
    bg: 'from-rose-200 to-rose-300',
    badge: { day: '18', month: 'MAI' },
    position: 'top-12 left-[30%] -translate-x-1/2',
    fit: 'object-contain',
  },
  {
    image: '/images/avatars/yellow-avatar.png',
    alt: 'Avatar João',
    bg: 'from-amber-200 to-orange-300',
    badge: { day: '05', month: 'ABR' },
    position: 'top-12 right-[30%] translate-x-1/2 flex-row-reverse',
    fit: 'object-cover',
  },
  {
    image: '/images/avatars/green-avatar.png',
    alt: 'Avatar Pedro',
    bg: 'from-emerald-200 to-emerald-300',
    badge: { day: '26', month: 'JUN' },
    position: 'bottom-12 left-[30%] -translate-x-1/2',
    fit: 'object-cover',
  },
  {
    image: '/images/avatars/purple-avatar.png',
    alt: 'Avatar Marina',
    bg: 'from-violet-200 to-purple-300',
    badge: { day: '10', month: 'AGO' },
    position: 'bottom-12 right-[30%] translate-x-1/2 flex-row-reverse',
    fit: 'object-cover',
  },
];

const ORBIT_LINES = [
  { d: 'M 50 50 C 42 46, 32 30, 24 20' },
  { d: 'M 50 50 C 58 46, 68 30, 76 20' },
  { d: 'M 50 50 C 42 54, 32 70, 24 80' },
  { d: 'M 50 50 C 58 54, 68 70, 76 80' },
];

const TIPS: Tip[] = [
  {
    icon: Link2,
    title: 'Convide com um link',
    description: 'Compartilhe o link do grupo com amigos, família ou colegas.',
  },
  {
    icon: Cake,
    title: 'Aniversários compartilhados',
    description:
      'Quando alguém entra no grupo, o aniversário fica visível pra todos.',
  },
  {
    icon: Bell,
    title: 'Lembretes pra todo mundo',
    description: 'No dia, todos os membros recebem um e-mail. Ninguém esquece.',
  },
];

export const GroupEmptyState = ({ onCreateClick }: GroupEmptyStateProps) => {
  return (
    <div className="animate-fade-in space-y-10">
      <div className="bg-muted/40 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="w-full max-w-md md:w-[28rem] shrink-0">
          <div className="relative aspect-square w-full">
            <svg
              aria-hidden="true"
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {ORBIT_LINES.map((line, idx) => (
                <path
                  key={idx}
                  d={line.d}
                  fill="none"
                  stroke="hsl(340, 80%, 65%)"
                  strokeOpacity="0.35"
                  strokeWidth="0.4"
                  strokeDasharray="1 1.5"
                  strokeLinecap="round"
                />
              ))}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-28 w-28 rounded-full bg-card shadow-soft flex items-center justify-center">
                <Image
                  src="/images/brand/logo.svg"
                  alt=""
                  width={64}
                  height={64}
                  aria-hidden="true"
                />
              </div>
            </div>

            {ORBIT_AVATARS.map((avatar, idx) => (
              <div
                key={idx}
                className={`absolute ${avatar.position} flex items-center gap-2`}
              >
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${avatar.bg} shadow-soft border-4 border-card overflow-hidden`}
                >
                  <Image
                    src={avatar.image}
                    alt={avatar.alt}
                    width={80}
                    height={80}
                    className={`h-full w-full ${avatar.fit}`}
                  />
                </div>
                <div className="rounded-xl bg-card shadow-soft px-2.5 py-1.5 text-center">
                  <div className="text-base font-bold leading-none text-foreground">
                    {avatar.badge.day}
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground tracking-wider">
                    {avatar.badge.month}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-3">
            Você ainda não tem grupos criados
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Crie seu primeiro grupo, convide quem você quer lembrar e todo mundo
            recebe os aniversários automaticamente.
          </p>
          <Button
            onClick={onCreateClick}
            className="gradient-warm text-white rounded-full px-6 py-3 font-semibold hover:opacity-90 transition-smooth"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar meu primeiro grupo
          </Button>
        </div>
      </div>

      <TipsSection title="Dicas para aproveitar os grupos" tips={TIPS} />
    </div>
  );
};
