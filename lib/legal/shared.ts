export type LegalBlock = { p: string } | { ul: string[] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  description: string;
  intro: string;
  sections: LegalSection[];
}

// Delete this constant (and the banner in LegalPage) once a lawyer reviews the texts.
export const DRAFT_NOTICE =
  'Rascunho em revisão. Este texto ainda não foi revisado por um advogado.';

export const LEGAL_LAST_UPDATED = '10 de novembro de 2026';

// Controller details. CPF and street address are intentionally not published; a lawyer confirms whether they are required.
export const COMPANY_NAME = 'Ramon Seugling';
export const COMPANY_ID = 'pessoa física';
export const COMPANY_ADDRESS = 'Florianópolis/SC';
export const CONTACT_EMAIL = 'contato@rememberly.com.br';
export const DPO_NAME = 'Ramon Seugling';
export const GOVERNING_CITY = 'Florianópolis/SC';
