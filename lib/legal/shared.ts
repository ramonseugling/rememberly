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

// Placeholders the owner must replace before publishing the final texts.
export const COMPANY_NAME = '[RAZÃO SOCIAL OU NOME DO RESPONSÁVEL]';
export const COMPANY_ID = '[CNPJ OU CPF]';
export const COMPANY_ADDRESS = '[ENDEREÇO COMPLETO]';
export const CONTACT_EMAIL = '[E-MAIL DE CONTATO]';
export const DPO_NAME = '[NOME DO ENCARREGADO (DPO), SE HOUVER]';
export const GOVERNING_CITY = '[COMARCA/FORO]';
