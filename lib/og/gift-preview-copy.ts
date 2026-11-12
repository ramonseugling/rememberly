export interface PreviewHeadline {
  headline: string;
  subtitle: string;
}

export function previewHeadline(
  firstName: string,
  daysUntil: number | null,
): PreviewHeadline {
  if (daysUntil === null)
    return { headline: 'Lista de presentes', subtitle: `de ${firstName}` };
  if (daysUntil === 0)
    return {
      headline: 'É hoje!',
      subtitle: `Aniversário de ${firstName}`,
    };
  return {
    headline: daysUntil === 1 ? 'Falta 1 dia' : `Faltam ${daysUntil} dias`,
    subtitle: `para o aniversário de ${firstName}`,
  };
}

export function previewTitle(firstName: string): string {
  return `Lista de presentes de ${firstName}`;
}

export function previewDescription(
  firstName: string,
  daysUntil: number | null,
): string {
  const { headline, subtitle } = previewHeadline(firstName, daysUntil);
  return daysUntil === null
    ? 'Veja a lista de presentes no Rememberly.'
    : `${headline} ${subtitle}. Veja a lista de presentes no Rememberly.`;
}
