import { Text } from 'react-native';
import type { TextProps } from 'react-native';
import { tokens } from '../tokens';

interface DsTextProps extends Omit<TextProps, 'role'> {
  role?: keyof typeof tokens.typography;
}

export const DsText = ({ role = 'body', style, ...props }: DsTextProps) => (
  <Text
    {...props}
    accessibilityRole={
      props.accessibilityRole ??
      (role === 'title' || role === 'section' ? 'header' : undefined)
    }
    style={[tokens.typography[role], { color: tokens.colors.text }, style]}
  />
);
