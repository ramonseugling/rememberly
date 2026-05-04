import type { GetServerSideProps } from 'next';
import {
  Cake,
  Gift,
  Heart,
  Mail,
  MessageCircleQuestion,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import { withAuth } from 'infra/page-guard';

interface User {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
}

interface HelpProps {
  user: User;
}

export const getServerSideProps: GetServerSideProps = withAuth(
  async (_context, user) => {
    return {
      props: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          birth_day: user.birth_day,
          birth_month: user.birth_month,
          birth_year: user.birth_year,
        },
      },
    };
  },
);

const FAQ_ITEMS = [
  {
    question: 'Quando recebo o e-mail de lembrete?',
    answer:
      'No próprio dia do evento, de manhã cedo. Se você configurar antecedência, o lembrete também chegará nos dias escolhidos antes da data.',
  },
  {
    question: 'Preciso informar o ano da data?',
    answer:
      'Não. O Rememberly registra apenas o dia e o mês — os eventos se repetem automaticamente todo ano.',
  },
  {
    question: 'Posso cadastrar eventos de outras pessoas?',
    answer:
      'Sim! Cada data é sua para acompanhar. Você pode cadastrar o aniversário ou qualquer data especial de qualquer pessoa.',
  },
  {
    question: 'Para que servem os grupos?',
    answer:
      'Grupos permitem que amigos e família compartilhem aniversários automaticamente. Quem entra no grupo vê os aniversários dos outros membros na sua lista de datas.',
  },
  {
    question: 'Posso receber lembrete com antecedência?',
    answer:
      'Sim. Ao cadastrar ou editar um evento, você pode escolher receber o lembrete com 1, 3, 7, 15 ou 30 dias de antecedência — além do lembrete no próprio dia.',
  },
  {
    question: 'Como excluo minha conta?',
    answer:
      'Entre em contato pelo e-mail de suporte abaixo e vamos excluir sua conta e todos os seus dados.',
  },
];

const EVENT_TYPES_INFO = [
  {
    icon: Cake,
    label: 'Aniversário',
    description: 'Data de nascimento de alguém especial.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Heart,
    label: 'Aniversário de Namoro',
    description: 'A data em que o relacionamento começou.',
    color: 'bg-rose-500/10 text-rose-500',
  },
  {
    icon: Heart,
    label: 'Aniversário de Casamento',
    description: 'O dia em que o casal se casou.',
    color: 'bg-rose-500/10 text-rose-500',
  },
  {
    icon: PartyPopper,
    label: 'Comemoração',
    description: 'Qualquer data especial que merece ser lembrada.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: Gift,
    label: 'Personalizado',
    description: 'Crie seu próprio tipo com um nome livre.',
    color: 'bg-secondary/10 text-secondary',
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '1',
    title: 'Cadastre eventos',
    description:
      'Adicione datas de aniversários, comemorações e momentos especiais das pessoas que você quer lembrar.',
  },
  {
    step: '2',
    title: 'Configure lembretes',
    description:
      'Escolha receber o e-mail no próprio dia ou com alguns dias de antecedência.',
  },
  {
    step: '3',
    title: 'Receba no momento certo',
    description:
      'No dia certo você recebe um e-mail automático. Sem precisar lembrar de nada.',
  },
];

export default function Help({ user: _user }: HelpProps) {
  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 max-w-3xl">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground leading-tight">
          Ajuda
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tudo o que você precisa saber para usar o Rememberly.
        </p>
      </div>

      {/* Como funciona */}
      <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-6 mb-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Como funciona
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {HOW_IT_WORKS_STEPS.map(({ step, title, description }) => (
            <div key={step} className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-heading font-bold">
                {step}
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tipos de evento */}
      <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-6 mb-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-5">
          <Gift className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Tipos de evento
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {EVENT_TYPES_INFO.map(({ icon: Icon, label, description, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Perguntas frequentes */}
      <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-6 mb-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-5">
          <MessageCircleQuestion className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Perguntas frequentes
          </h2>
        </div>

        <div className="flex flex-col divide-y divide-border/50">
          {FAQ_ITEMS.map(({ question, answer }) => (
            <div key={question} className="py-4 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-foreground">
                {question}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contato */}
      <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-5 h-5 text-foreground/60" />
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Contato
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Tem alguma dúvida ou problema?{' '}
          <a
            href="mailto:ramonseugling@gmail.com"
            className="text-primary font-medium hover:underline"
          >
            Fale com a gente
          </a>
          .
        </p>
      </div>
    </section>
  );
}
