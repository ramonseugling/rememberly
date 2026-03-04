interface HelloCardProps {
  name: string;
}

export const HelloCard = ({ name }: HelloCardProps) => {
  const currentMonth = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
  });

  return (
    <div className="mb-8 animate-fade-in">
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
        Olá, {name}! 👋
      </h2>
      <p className="text-lg text-muted-foreground">
        Aqui estão as datas importantes de{' '}
        <span className="font-semibold text-primary capitalize">
          {currentMonth}
        </span>
      </p>
    </div>
  );
};
