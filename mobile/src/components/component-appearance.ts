import { theme } from '../theme';
import { Platform } from 'react-native';

export interface ComponentAppearance {
  controlMinHeight?: number;
  controlRadius?: number;
  buttonRadius?: number;
  gradient?: readonly [string, string, ...string[]];
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
  sheet?: {
    backdrop: string;
    closeBackground: string;
    titleSize: number;
    gutter: number;
  };
}

export function resolveAppearance(appearance?: ComponentAppearance) {
  const fonts = { ...theme.fonts, ...appearance?.fonts };
  const nativeFamily = Platform.OS === 'ios' ? 'System' : 'sans-serif';
  return {
    controlMinHeight: appearance?.controlMinHeight ?? 44,
    controlRadius: appearance?.controlRadius ?? 16,
    buttonRadius: appearance?.buttonRadius ?? appearance?.controlRadius ?? 16,
    gradient: appearance?.gradient ?? theme.gradient,
    colors: {
      ...theme.colors,
      ...appearance?.colors,
      controlBorder: appearance?.colors.controlBorder ?? theme.colors.border,
      primary: appearance?.colors.primary ?? theme.colors.primary,
      surfaceMuted:
        appearance?.colors.surfaceMuted ?? 'hsla(340, 75%, 68%, 0.1)',
      destructive: appearance?.colors.destructive ?? theme.colors.destructive,
    },
    fonts: {
      ...fonts,
      body: fonts.body === 'System' ? nativeFamily : fonts.body,
      heading: fonts.heading === 'System' ? nativeFamily : fonts.heading,
      bold: fonts.bold === 'System' ? nativeFamily : fonts.bold,
    },
    sheet: {
      backdrop: appearance?.sheet?.backdrop ?? 'rgba(36, 43, 92, 0.3)',
      closeBackground: appearance?.sheet?.closeBackground,
      titleSize: appearance?.sheet?.titleSize ?? 22,
      gutter: appearance?.sheet?.gutter ?? 24,
    },
    fontWeights: {
      body: fonts.body === 'System' ? ('400' as const) : undefined,
      heading: fonts.heading === 'System' ? ('700' as const) : undefined,
      bold: fonts.bold === 'System' ? ('600' as const) : undefined,
    },
  };
}

export type ResolvedAppearance = ReturnType<typeof resolveAppearance>;
