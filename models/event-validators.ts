import { ValidationError } from 'infra/errors';

const VALID_TYPES = [
  'birthday',
  'dating_anniversary',
  'wedding_anniversary',
  'celebration',
  'custom',
] as const;

type EventType = (typeof VALID_TYPES)[number];

function validateType(type: string): asserts type is EventType {
  if (!VALID_TYPES.includes(type as EventType)) {
    throw new ValidationError({
      message: `Tipo de evento inválido: "${type}".`,
      action: `Use um dos tipos válidos: ${VALID_TYPES.join(', ')}.`,
    });
  }
}

function validateCustomType(customType: string | null | undefined): string {
  if (!customType || customType.trim() === '') {
    throw new ValidationError({
      message:
        'O tipo personalizado é obrigatório quando o tipo é "Personalizado".',
      action: 'Informe um nome para o tipo personalizado.',
    });
  }

  const trimmed = customType.trim();

  if (trimmed.length > 100) {
    throw new ValidationError({
      message: 'O tipo personalizado deve ter no máximo 100 caracteres.',
      action: 'Reduza o tamanho do tipo personalizado.',
    });
  }

  return trimmed;
}

function validateDay(day: number) {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new ValidationError({
      message: 'Dia do evento inválido.',
      action: 'O dia deve ser um número inteiro entre 1 e 31.',
    });
  }
}

function validateMonth(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ValidationError({
      message: 'Mês do evento inválido.',
      action: 'O mês deve ser um número inteiro entre 1 e 12.',
    });
  }
}

function validateTitle(title: string | undefined | null): string {
  if (!title || title.trim() === '') {
    throw new ValidationError({
      message: 'O título do evento é obrigatório.',
      action: 'Informe um título para o evento.',
    });
  }

  return title.trim();
}

export {
  VALID_TYPES,
  validateType,
  validateCustomType,
  validateDay,
  validateMonth,
  validateTitle,
};
export type { EventType };
