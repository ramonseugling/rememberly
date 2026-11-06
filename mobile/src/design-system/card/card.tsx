import { View, StyleSheet } from 'react-native';
import type { ViewProps } from 'react-native';
import { tokens } from '../tokens';

export const DsCard = ({ style, ...props }: ViewProps) => (
  <View {...props} style={[styles.card, style]} />
);
const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 16,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
});
