import { useState } from 'react';
import {
  Check,
  Copy,
  MessageCircle,
  MoreVertical,
  Settings,
  Share2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MONTHS } from '@/lib/constants';

interface GroupHeaderProps {
  group: {
    id: string;
    name: string;
    invite_code: string;
    role: 'owner' | 'member';
    member_count: number;
    created_at: string;
  };
  creatorName: string | null;
  isOwner: boolean;
  onConfigClick: () => void;
}

export const GroupHeader = ({
  group,
  creatorName,
  isOwner,
  onConfigClick,
}: GroupHeaderProps) => {
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

  const created = new Date(group.created_at);
  const createdLabel = `Criado em ${created.getDate()} de ${MONTHS[created.getMonth()]} de ${created.getFullYear()}`;

  const creatorLabel = isOwner
    ? 'Criado por você'
    : creatorName
      ? `Criado por ${creatorName}`
      : '';

  return (
    <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-6 mb-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Users className="w-7 h-7 sm:w-9 sm:h-9" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground leading-tight">
            {group.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {group.member_count}{' '}
            {group.member_count === 1 ? 'membro' : 'membros'}
            {creatorLabel && (
              <>
                {' '}
                · <span>{creatorLabel}</span>
              </>
            )}
          </p>
          <span className="inline-flex items-center mt-3 rounded-full bg-muted/60 text-foreground/80 px-3 py-1 text-xs font-medium">
            {createdLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:self-start">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="rounded-2xl border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                Convidar
              </Button>
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
                href={`https://wa.me/?text=${encodeURIComponent(`Entrei no Rememberly e criei o grupo *${group.name}* — entra com a gente! ${inviteLink}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-medium py-1.5 px-3 rounded-xl transition-smooth"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            className="rounded-2xl border-border/60 gap-1.5"
            onClick={onConfigClick}
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Button>

          <button
            type="button"
            aria-label="Mais opções"
            className="shrink-0 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
