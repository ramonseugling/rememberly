import Link from 'next/link';
import { PartyPopper } from 'lucide-react';

interface NextGroupDateBannerProps {
  daysUntil: number;
  memberName: string;
  date: string;
  groupName: string;
  groupId: string;
}

export const NextGroupDateBanner = ({
  daysUntil,
  memberName,
  date,
  groupName,
  groupId,
}: NextGroupDateBannerProps) => {
  const daysLabel =
    daysUntil === 0
      ? 'hoje!'
      : daysUntil === 1
        ? 'amanhã!'
        : `em ${daysUntil} dias!`;

  return (
    <div className="gradient-warm rounded-2xl p-5 mb-6 flex items-center gap-4 animate-fade-in overflow-hidden relative">
      <div className="flex-1 min-w-0">
        <p className="text-white font-heading font-bold text-lg leading-tight mb-1">
          Próxima data {daysLabel}
        </p>
        <p className="text-white/85 text-sm leading-snug">
          {memberName} faz aniversário em {date} no grupo {groupName}.
        </p>
      </div>

      <div
        aria-hidden
        className="shrink-0 hidden sm:flex items-center justify-center w-16 h-16 rounded-full bg-white/15"
      >
        <PartyPopper className="w-8 h-8 text-white" />
      </div>

      <Link
        href={`/groups/${groupId}`}
        className="shrink-0 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90 transition-colors whitespace-nowrap"
      >
        Ver detalhes
      </Link>
    </div>
  );
};
