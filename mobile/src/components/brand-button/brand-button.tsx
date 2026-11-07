import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../brand-text/brand-text';
import {
  resolveAppearance,
  type ComponentAppearance,
  type ResolvedAppearance,
} from '../component-appearance';

interface BrandButtonProps {
  appearance?: ComponentAppearance;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  pending?: boolean;
  variant?: 'gradient' | 'outline' | 'solid' | 'destructive';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const BrandButton = ({
  appearance,
  label,
  onPress,
  disabled = false,
  pending = false,
  variant = 'gradient',
  icon,
  style,
}: BrandButtonProps) => {
  const theme = resolveAppearance(appearance);
  const styles = createStyles(theme);
  const inactive = disabled || pending;
  const color =
    variant === 'outline'
      ? theme.colors.foreground
      : variant === 'destructive'
        ? theme.colors.destructive
        : '#ffffff';
  const content = (
    <>
      {pending ? (
        <ActivityIndicator color={color} accessibilityLabel="Aguarde" />
      ) : (
        icon
      )}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: pending }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'solid' && styles.solid,
        variant !== 'gradient' && styles.outline,
        style,
        (inactive || pressed) && { opacity: inactive ? 0.4 : 0.8 },
      ]}
    >
      {variant === 'gradient' ? (
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.content}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={styles.content}>{content}</View>
      )}
    </Pressable>
  );
};

const createStyles = (theme: ResolvedAppearance) =>
  StyleSheet.create({
    button: {
      borderRadius: theme.buttonRadius,
      overflow: 'hidden',
      minHeight: theme.controlMinHeight,
    },
    outline: { borderWidth: 1, borderColor: theme.colors.border },
    solid: { backgroundColor: theme.colors.primary },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 11,
      minHeight: theme.controlMinHeight,
    },
    label: {
      flexShrink: 1,
      fontSize: 14,
      fontFamily: theme.fonts.bold,
      fontWeight: theme.fontWeights.bold,
      textAlign: 'center',
    },
  });
