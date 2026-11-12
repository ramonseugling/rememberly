import {
  previewDescription,
  previewHeadline,
  previewTitle,
} from '@/lib/og/gift-preview-copy';

describe('gift preview copy', () => {
  it('writes the countdown headline', () => {
    expect(previewHeadline('Ana', 5)).toEqual({
      headline: 'Faltam 5 dias',
      subtitle: 'para o aniversário de Ana',
    });
    expect(previewHeadline('Ana', 1).headline).toBe('Falta 1 dia');
    expect(previewHeadline('Ana', 0).headline).toBe('É hoje!');
  });

  it('falls back to a plain title when there is no birthday', () => {
    expect(previewHeadline('Ana', null)).toEqual({
      headline: 'Lista de presentes',
      subtitle: 'de Ana',
    });
    expect(previewDescription('Ana', null)).toBe(
      'Veja a lista de presentes no Rememberly.',
    );
  });

  it('builds the title and description for the link card', () => {
    expect(previewTitle('Ana')).toBe('Lista de presentes de Ana');
    expect(previewDescription('Ana', 5)).toContain('Faltam 5 dias');
  });
});
