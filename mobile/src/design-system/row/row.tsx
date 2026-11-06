import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AccessibilityState, StyleProp, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsRowProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
}
export const DsRow = ({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  disabled,
  style,
  accessibilityState,
  accessibilityLabel,
}: DsRowProps) => {
  const content = (
    <>
      {leading}
      <View style={styles.copy}>
        <DsText role="label">{title}</DsText>
        {subtitle && (
          <DsText role="caption" style={{ color: tokens.colors.textMuted }}>
            {subtitle}
          </DsText>
        )}
      </View>
      {trailing ??
        (onPress && <ChevronRight color={tokens.colors.textMuted} size={20} />)}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        style,
        pressed && { backgroundColor: tokens.colors.surfaceMuted },
        disabled && { opacity: 0.45 },
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={[styles.row, style]}
    >
      {content}
    </View>
  );
};
const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    padding: 12,
    borderRadius: tokens.radius.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.colors.surface,
  },
  copy: { flex: 1, minWidth: 0, gap: 3 },
});
