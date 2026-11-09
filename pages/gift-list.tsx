import type { GetServerSideProps } from 'next';
import { Gift } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface GiftListLinkProps {
  appLink: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getServerSideProps: GetServerSideProps<GiftListLinkProps> = async (
  context,
) => {
  const user = context.query.user;
  if (typeof user !== 'string' || !UUID.test(user)) {
    return { redirect: { destination: '/', permanent: false } };
  }
  return { props: { appLink: `rememberly://gift-list?user=${user}` } };
};

export default function GiftListLink({ appLink }: GiftListLinkProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="rounded-3xl border-border/50 max-w-md w-full p-8 text-center animate-fade-in">
        <div className="mb-6">
          <div className="w-16 h-16 rounded-2xl bg-violet/10 text-violet flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
            Lista de presentes
          </h2>
          <p className="text-muted-foreground">
            Abra este link no aplicativo Rememberly para ver a lista. Ela só
            aparece para quem está em um grupo com a pessoa que compartilhou.
          </p>
        </div>
        <a
          href={appLink}
          className="inline-flex w-full items-center justify-center gradient-violet text-white hover:opacity-90 rounded-2xl py-3 font-semibold transition-smooth"
        >
          Abrir no aplicativo
        </a>
      </Card>
    </div>
  );
}
