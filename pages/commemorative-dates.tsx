import type { GetServerSideProps } from 'next';
import { CommemorativeDatesList } from '@/components/commemorative-dates-page/commemorative-dates-list';
import { withAuth } from 'infra/page-guard';
import commemorative, {
  type CommemorativeDateItem,
} from 'models/commemorative';

interface User {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
}

interface CommemorativeDatesProps {
  user: User;
  items: CommemorativeDateItem[];
}

export const getServerSideProps: GetServerSideProps = withAuth(
  async (_context, user) => {
    const items = await commemorative.listForUser(user.id);
    return {
      props: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          birth_day: user.birth_day,
          birth_month: user.birth_month,
          birth_year: user.birth_year,
        },
        items,
      },
    };
  },
);

export default function CommemorativeDates({ items }: CommemorativeDatesProps) {
  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 max-w-3xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground leading-tight">
          Datas comemorativas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ative os lembretes que deseja receber com 7 dias de antecedência.
        </p>
      </div>

      <CommemorativeDatesList items={items} />
    </section>
  );
}
