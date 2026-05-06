import type { LucideIcon } from 'lucide-react';

export interface Tip {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface TipsSectionProps {
  title: string;
  tips: Tip[];
}

export const TipsSection = ({ title, tips }: TipsSectionProps) => {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-heading font-semibold text-muted-foreground text-center uppercase tracking-wide">
        {title}
      </h3>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tips.map(({ icon: Icon, title: tipTitle, description }) => (
          <li
            key={tipTitle}
            className="bg-card rounded-2xl p-5 border border-border/60 flex flex-col items-center text-center gap-2 transition-smooth hover:shadow-soft"
          >
            <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <p className="font-heading font-semibold text-foreground">
              {tipTitle}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};
