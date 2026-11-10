import { LegalPage } from '@/components/legal-page/legal-page';
import { termsDocument } from '@/lib/legal/terms';

export default function Termos() {
  return (
    <LegalPage
      document={termsDocument}
      otherPage={{
        href: '/privacidade',
        label: 'Ler a Política de Privacidade',
      }}
    />
  );
}
