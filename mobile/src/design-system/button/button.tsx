import { useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const content = (
    <>
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
    </>
  );
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
        variant === 'outline' && styles.outline,
        variant === 'destructive' && styles.destructive,
        focused && styles.focused,
        pressed &&
          variant !== 'primary' && {
            backgroundColor: tokens.colors.iconSurface,
          },
        inactive && styles.disabled,
        style,
      ]}
    >
      {({ pressed }) =>
        variant === 'primary' ? (
          <LinearGradient
            colors={
              pressed ? tokens.actionPressedGradient : tokens.actionGradient
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.content}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={styles.content}>{content}</View>
        )
      }
    </Pressable>
  );
};
const styles = StyleSheet.create({
  button: {
    minHeight: tokens.controlMinHeight,
    minWidth: 48,
    borderRadius: tokens.radius.button,
    overflow: 'hidden',
  },
  content: {
    minHeight: tokens.controlMinHeight,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outline: {
    borderWidth: 1,
    borderColor: tokens.colors.outlineBorder,
    backgroundColor: tokens.colors.surfaceMuted,
  },
  destructive: {
    borderWidth: 1,
    borderColor: tokens.colors.outlineBorder,
    backgroundColor: tokens.colors.dangerSurface,
  },
  focused: {
    outlineColor: tokens.colors.primary,
    outlineWidth: 2,
    outlineOffset: 2,
  },
  disabled: { opacity: 0.45 },
});
