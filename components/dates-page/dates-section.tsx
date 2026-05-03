import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatesSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
}

export const DatesSection = ({
  title,
  icon: Icon,
  iconColor = 'text-primary',
  children,
}: DatesSectionProps) => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('w-4 h-4', iconColor)} />
        <h2 className={cn('text-sm font-semibold', iconColor)}>{title}</h2>
      </div>
      {children}
    </section>
  );
};
