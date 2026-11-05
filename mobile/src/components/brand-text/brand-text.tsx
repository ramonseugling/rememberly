import { Text as NativeText, type TextProps } from 'react-native';
import { theme } from '../../theme';

export const Text = ({ style, ...props }: TextProps) => (
  <NativeText
    {...props}
    style={[
      { fontFamily: theme.fonts.body, color: theme.colors.foreground },
      style,
    ]}
  />
);
