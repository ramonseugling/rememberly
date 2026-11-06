import { useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  pending?: boolean;
  variant?: 'primary' | 'outline' | 'destructive' | 'text';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const DsButton = ({
  label,
  onPress,
  disabled = false,
  pending = false,
  variant = 'primary',
  icon,
  style,
}: DsButtonProps) => {
  const [focused, setFocused] = useState(false);
  const inactive = disabled || pending;
  const color =
    variant === 'primary'
      ? tokens.colors.onPrimary
      : variant === 'destructive'
        ? tokens.colors.danger
        : tokens.colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: pending }}
      disabled={inactive}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'destructive' && styles.destructive,
        variant === 'text' && styles.text,
        focused && styles.focused,
        pressed && {
          backgroundColor:
            variant === 'primary'
              ? tokens.colors.primaryPressed
              : tokens.colors.surfaceMuted,
        },
        inactive && styles.disabled,
        style,
      ]}
    >
      {pending ? (
        <ActivityIndicator accessibilityLabel="Aguarde" color={color} />
      ) : (
        icon
      )}
      <DsText
        role="label"
        style={{ color, textAlign: 'center', flexShrink: 1 }}
      >
        {label}
      </DsText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: tokens.controlMinHeight,
    minWidth: 48,
    borderRadius: tokens.radius.control,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: { backgroundColor: tokens.colors.primary },
  outline: {
    borderWidth: 1,
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.surface,
  },
  destructive: {
    borderWidth: 1,
    borderColor: tokens.colors.danger,
    backgroundColor: tokens.colors.surface,
  },
  text: { backgroundColor: 'transparent' },
  focused: {
    outlineColor: tokens.colors.primary,
    outlineWidth: 2,
    outlineOffset: 2,
  },
  disabled: { opacity: 0.45 },
});
