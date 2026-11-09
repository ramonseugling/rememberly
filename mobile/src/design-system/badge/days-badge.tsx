import { DsBadge } from './badge';
import { daysBadge } from './days';

interface DsDaysBadgeProps {
  days: number;
  farLabel?: string;
  nextYear?: boolean;
}

export const DsDaysBadge = ({ days, farLabel, nextYear }: DsDaysBadgeProps) => {
  const { label, tone } = daysBadge(days, farLabel, nextYear);
  return <DsBadge label={label} tone={tone} />;
};
