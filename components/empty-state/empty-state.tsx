import { Calendar } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-muted flex items-center justify-center">
        <Calendar className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-heading font-semibold mb-2">
        Nenhuma data cadastrada
      </h3>
      <p className="text-muted-foreground mb-6">
        Comece adicionando as datas importantes para você!
      </p>
    </div>
  );
};
