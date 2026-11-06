const fonts = {
  body: 'Quicksand_500Medium',
  bold: 'Quicksand_700Bold',
  heading: 'Quicksand_700Bold',
  headingBold: 'Quicksand_700Bold',
} as const;

export const tokens = {
  colors: {
    background: '#FCF8FA',
    surface: '#FFFFFF',
    surfaceMuted: '#F6EEF2',
    text: '#2B2026',
    textMuted: '#6F636B',
    primary: '#BF2E5B',
    primaryPressed: '#A4224D',
    onPrimary: '#FFFFFF',
    border: '#E8DDE2',
    controlBorder: '#9C8791',
    danger: '#B42335',
    success: '#176744',
    accent: '#F08B51',
  },
  fonts,
  typography: {
    title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 34 },
    section: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 26 },
    body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
    label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20 },
    caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  },
  spacing: { 4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32, 40: 40 },
  radius: { control: 14, row: 16, card: 20, sheet: 28 },
  controlMinHeight: 48,
  celebration: ['#F6BDD0', '#FAD9C3'] as const,
} as const;

export const appearance = {
  controlMinHeight: tokens.controlMinHeight,
  controlRadius: tokens.radius.control,
  colors: {
    background: tokens.colors.surface,
    foreground: tokens.colors.text,
    muted: tokens.colors.textMuted,
    border: tokens.colors.border,
    controlBorder: tokens.colors.controlBorder,
    primary: tokens.colors.primary,
    surfaceMuted: tokens.colors.surfaceMuted,
    destructive: tokens.colors.danger,
  },
  fonts: {
    heading: tokens.fonts.bold,
    body: tokens.fonts.body,
    bold: tokens.fonts.bold,
  },
};
