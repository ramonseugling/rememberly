export const theme = {
  colors: {
    background: 'hsl(20, 55%, 98%)',
    foreground: 'hsl(230, 45%, 25%)',
    card: '#ffffff',
    primary: 'hsl(340, 75%, 68%)',
    secondary: 'hsl(280, 65%, 70%)',
    muted: 'hsl(230, 25%, 50%)',
    border: 'hsl(340, 35%, 92%)',
    mutedBackground: 'hsl(25, 45%, 94%)',
    destructive: 'hsl(0, 84%, 60%)',
    accent: 'hsl(25, 85%, 65%)',
  },
  spacing: { small: 8, medium: 16, large: 24 },
  radius: 24,
  fonts: {
    heading: 'Fredoka_600SemiBold',
    headingBold: 'Fredoka_700Bold',
    body: 'Quicksand_500Medium',
    bold: 'Quicksand_700Bold',
  },
  gradient: ['hsl(340, 75%, 68%)', 'hsl(25, 85%, 65%)'] as const,
} as const;
