import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsChipProps {
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const DsChip = ({
  label,
  icon,
  selected,
  onPress,
  disabled,
  style,
}: DsChipProps) => {
  const content = (
    <>
      {icon}
      <DsText
        role="caption"
        style={{
          color: selected ? tokens.colors.onPrimary : tokens.colors.textMuted,
          fontFamily: tokens.fonts.bold,
          fontWeight: '600',
        }}
      >
        {label}
      </DsText>
    </>
  );
  const body = selected ? (
    <LinearGradient
      colors={tokens.actionGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.content}
    >
      {content}
    </LinearGradient>
  ) : (
    <View style={styles.content}>{content}</View>
  );
  if (!onPress)
    return <View style={[styles.chip, styles.idle, style]}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        !selected && styles.idle,
        style,
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.45 },
      ]}
    >
      {body}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', borderRadius: 16, overflow: 'hidden' },
  idle: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  content: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
