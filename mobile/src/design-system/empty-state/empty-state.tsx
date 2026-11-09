import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { DsButton } from '../button/button';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsEmptyStateProps {
  title: string;
  description: string;
  illustration?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const DsEmptyState = ({
  title,
  description,
  illustration,
  actionLabel,
  onAction,
}: DsEmptyStateProps) => (
  <View style={styles.card}>
    {illustration}
    <View style={styles.copy}>
      <DsText role="section" style={styles.center}>
        {title}
      </DsText>
      <DsText style={[styles.center, { color: tokens.colors.textMuted }]}>
        {description}
      </DsText>
    </View>
    {actionLabel && onAction && (
      <DsButton label={actionLabel} onPress={onAction} />
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'stretch',
    gap: 16,
    borderRadius: tokens.radius.sheet,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  copy: { gap: 8 },
  center: { textAlign: 'center' },
});
