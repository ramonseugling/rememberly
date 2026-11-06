import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { Text } from '../brand-text/brand-text';
import {
  resolveAppearance,
  type ComponentAppearance,
  type ResolvedAppearance,
} from '../component-appearance';

interface SelectFieldProps {
  controlStyle?: StyleProp<ViewStyle>;
  appearance?: ComponentAppearance;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SelectField = ({
  controlStyle,
  appearance,
  label,
  value,
  options,
  onChange,
  disabled,
}: SelectFieldProps) => {
  const theme = resolveAppearance(appearance);
  const styles = createStyles(theme);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value)?.label;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label + ': ' + (selected ?? 'Selecione')}
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        disabled={disabled}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={[styles.field, controlStyle, disabled && { opacity: 0.5 }]}
      >
        <Text style={styles.value}>{selected ?? label}</Text>
        <ChevronDown size={16} color={theme.colors.muted} />
      </Pressable>
      <BottomSheet
        appearance={appearance}
        visible={open}
        title={label}
        onClose={() => setOpen(false)}
      >
        <View accessibilityRole="radiogroup" style={{ gap: 2 }}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{
                checked: option.value === value,
                disabled: !!disabled,
              }}
              disabled={disabled}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={[styles.option, option.value === value && styles.selected]}
            >
              <Text style={styles.value}>{option.label}</Text>
              {option.value === value && (
                <Check color={theme.colors.primary} size={20} />
              )}
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </>
  );
};

const createStyles = (theme: ResolvedAppearance) =>
  StyleSheet.create({
    field: {
      borderWidth: 1,
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.controlRadius,
      minHeight: theme.controlMinHeight,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    value: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.foreground,
      fontFamily: theme.fonts.body,
    },
    option: {
      minHeight: 48,
      paddingVertical: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 12,
    },
    selected: { backgroundColor: theme.colors.surfaceMuted },
  });
