import { theme } from '../theme';

export interface ComponentAppearance {
  controlMinHeight?: number;
  controlRadius?: number;
  colors: {
    background: string;
    foreground: string;
    muted: string;
    border: string;
    controlBorder?: string;
    primary?: string;
    surfaceMuted?: string;
    destructive?: string;
  };
  fonts: { heading: string; body: string; bold: string };
}

export function resolveAppearance(appearance?: ComponentAppearance) {
  return {
    controlMinHeight: appearance?.controlMinHeight ?? 44,
    controlRadius: appearance?.controlRadius ?? 16,
    gradient: theme.gradient,
    colors: {
      ...theme.colors,
      ...appearance?.colors,
      controlBorder: appearance?.colors.controlBorder ?? theme.colors.border,
      primary: appearance?.colors.primary ?? theme.colors.primary,
      surfaceMuted:
        appearance?.colors.surfaceMuted ?? 'hsla(340, 75%, 68%, 0.1)',
      destructive: appearance?.colors.destructive ?? theme.colors.destructive,
    },
    fonts: { ...theme.fonts, ...appearance?.fonts },
  };
}

export type ResolvedAppearance = ReturnType<typeof resolveAppearance>;
