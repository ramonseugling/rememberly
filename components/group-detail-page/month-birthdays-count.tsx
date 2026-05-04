interface MonthBirthdaysCountProps {
  count: number;
}

export const MonthBirthdaysCount = ({ count }: MonthBirthdaysCountProps) => {
  return (
    <div className="rounded-2xl bg-accent/10 p-4 sm:w-56 animate-fade-in">
      <p className="text-xs font-medium text-accent mb-2 leading-tight">
        Aniversários neste mês
      </p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-3xl font-heading font-bold text-foreground leading-none">
            {count}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {count === 1 ? 'pessoa' : 'pessoas'} 🎉
          </p>
        </div>
        <span className="text-3xl select-none" aria-hidden>
          🧁
        </span>
      </div>
    </div>
  );
};
