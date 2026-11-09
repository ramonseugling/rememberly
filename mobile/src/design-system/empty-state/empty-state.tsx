import { LinearGradient } from 'expo-linear-gradient';
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
  actionIcon?: ReactNode;
  actionVariant?: 'primary' | 'soft';
  onAction?: () => void;
  compact?: boolean;
}

export const DsEmptyState = ({
  title,
  description,
  illustration,
  actionLabel,
  actionIcon,
  actionVariant = 'primary',
  onAction,
  compact,
}: DsEmptyStateProps) => (
  <View style={[styles.card, compact && styles.compact]}>
    {illustration}
    <View style={styles.copy}>
      <DsText
        role="section"
        style={[styles.center, compact && styles.compactTitle]}
      >
        {title}
      </DsText>
      <DsText style={[styles.center, { color: tokens.colors.textMuted }]}>
        {description}
      </DsText>
    </View>
    {actionLabel && onAction && (
      <DsButton
        label={actionLabel}
        icon={actionIcon}
        variant={actionVariant}
        onPress={onAction}
      />
    )}
  </View>
);

export const DsEmptyIcon = ({
  children,
  size = 56,
  gradient,
}: {
  children: ReactNode;
  size?: number;
  gradient?: boolean;
}) => {
  const box = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  return gradient ? (
    <LinearGradient
      colors={tokens.actionGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.icon, box]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[styles.icon, box]}>{children}</View>
  );
};

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
  compact: {
    paddingVertical: 22,
    paddingHorizontal: 16,
    gap: 12,
    borderRadius: tokens.radius.card,
  },
  compactTitle: { fontSize: 18, lineHeight: 24 },
  copy: { gap: 4 },
  center: { textAlign: 'center' },
  icon: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.iconSurface,
  },
});
