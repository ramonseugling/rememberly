import { LegalPage } from '@/components/legal-page/legal-page';
import { privacyDocument } from '@/lib/legal/privacy';

export default function Privacidade() {
  return (
    <LegalPage
      document={privacyDocument}
      otherPage={{ href: '/termos', label: 'Ler os Termos de Uso' }}
    />
  );
}
