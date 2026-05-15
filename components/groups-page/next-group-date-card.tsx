import type { BirthdayMember } from '@/lib/types';

interface NextGroupDateCardProps {
  member: BirthdayMember;
  groups: { id: string; name: string }[];
}

export const NextGroupDateCard = ({
  member,
  groups,
}: NextGroupDateCardProps) => {
  const daysLabel =
    member.days_until === 0
      ? 'hoje!'
      : member.days_until === 1
        ? 'amanhã!'
        : `em ${member.days_until} dias!`;

  const dateLabel = `${String(member.birth_day).padStart(2, '0')}/${String(member.birth_month).padStart(2, '0')}`;
  const firstName = member.name.split(' ')[0];

  return (
    <div className="gradient-warm h-full rounded-2xl p-5 flex items-center gap-4 animate-fade-in overflow-hidden relative">
      <div
        aria-hidden
        className="shrink-0 hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white font-heading font-bold text-primary text-base leading-none tracking-tight"
      >
        {dateLabel}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-heading font-bold text-lg leading-tight mb-1">
          Aniversário de {member.name} {daysLabel}
        </p>
        <p className="text-white/85 text-sm leading-snug">
          {groups.length === 1 ? (
            <>
              {firstName} faz parte do grupo{' '}
              <strong className="font-semibold">{groups[0].name}</strong>.
            </>
          ) : (
            <>
              {firstName} faz parte de {groups.length} grupos.
            </>
          )}
        </p>
      </div>
    </div>
  );
};
