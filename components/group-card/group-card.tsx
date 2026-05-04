import { useState } from 'react';
import Link from 'next/link';
import {
  Cake,
  Check,
  ChevronRight,
  Copy,
  MessageCircle,
  MoreVertical,
  Plus,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MONTHS } from '@/lib/constants';
import { formatDaysLabel } from '@/lib/date-utils';
import type { GroupInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GroupCardProps {
  group: GroupInfo;
}

export const GroupCard = ({ group }: GroupCardProps) => {
  const next = group.upcoming_birthdays[0];
  const [copied, setCopied] = useState(false);

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join-group?code=${group.invite_code}`
      : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Entrei no Rememberly e criei o grupo *${group.name}* — entra com a gente! ${inviteLink}`,
  )}`;

  return (
    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden p-5 flex flex-col gap-4 animate-fade-in hover:shadow-soft transition-smooth">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-base text-foreground leading-tight truncate">
              {group.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-tight">
              {group.member_count}{' '}
              {group.member_count === 1 ? 'membro' : 'membros'}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Mais opções"
          className="shrink-0 -mr-1 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            group.role === 'owner'
              ? 'bg-primary/15 text-primary'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {group.role === 'owner' ? 'Criador' : 'Membro'}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Próximo aniversário
        </p>
        <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
          <div
            className={cn(
              'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
              next
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <Cake className="w-4 h-4" />
          </div>
          {next ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold text-sm text-foreground truncate leading-tight">
                  {next.name}
                </p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {next.birth_day} de {MONTHS[next.birth_month - 1]}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs font-semibold">
                {formatDaysLabel(next.days_until)}
              </span>
            </>
          ) : (
            <div className="min-w-0">
              <p className="font-heading font-semibold text-sm text-muted-foreground leading-tight">
                Nenhuma data próxima
              </p>
              <p className="text-xs text-muted-foreground/80 leading-tight mt-0.5">
                Tudo em dia! 🎉
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        <Link
          href={`/groups/${group.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-2xl border border-border/60 px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-smooth"
        >
          Ver grupo
          <ChevronRight className="w-4 h-4" />
        </Link>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 text-sm font-semibold transition-smooth"
            >
              <Plus className="w-4 h-4" />
              Convidar
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="end">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Convide para o grupo
            </p>
            <div className="flex gap-2 mb-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 min-w-0 bg-muted rounded-xl px-3 py-1.5 text-xs text-muted-foreground border border-border/40 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1.5 text-xs font-medium inline-flex items-center gap-1 shrink-0"
              >
                {copied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-medium py-1.5 px-3 rounded-xl transition-smooth"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </PopoverContent>
        </Popover>
      </div>
    </Card>
  );
};
