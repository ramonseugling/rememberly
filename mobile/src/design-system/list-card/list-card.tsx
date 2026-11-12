import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AccessibilityState, StyleProp, ViewStyle } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsListCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  footer?: ReactNode;
  accessibilityState?: AccessibilityState;
  iconTone?: 'brand' | 'neutral';
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const DsListCard = ({
  title,
  subtitle,
  icon,
  iconTone = 'brand',
  accessibilityState,
  trailing,
  footer,
  onPress,
  disabled,
  style,
}: DsListCardProps) => {
  const content = (
    <>
      {icon && (
        <View
          style={[
            styles.icon,
            iconTone === 'neutral' && {
              backgroundColor: tokens.colors.surfaceMuted,
            },
          ]}
        >
          {icon}
        </View>
      )}
      <View style={styles.copy}>
        <DsText role="label">{title}</DsText>
        {subtitle && (
          <DsText role="caption" style={{ color: tokens.colors.textMuted }}>
            {subtitle}
          </DsText>
        )}
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
      {trailing ??
        (onPress && <ChevronRight color={tokens.colors.textMuted} size={20} />)}
    </>
  );
  if (!onPress) return <View style={[styles.card, style]}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        style,
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.45 },
      ]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.iconSurface,
  },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  footer: { alignSelf: 'flex-start', marginTop: 4 },
});
