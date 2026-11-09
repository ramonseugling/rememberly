import { DsBadge } from './badge';
import { daysBadge } from './days';

interface DsDaysBadgeProps {
  days: number;
  farLabel?: string;
}

export const DsDaysBadge = ({ days, farLabel }: DsDaysBadgeProps) => {
  const { label, tone } = daysBadge(days, farLabel);
  return <DsBadge label={label} tone={tone} />;
};
