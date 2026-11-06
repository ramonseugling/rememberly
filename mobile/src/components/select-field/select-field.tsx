import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { Text } from '../brand-text/brand-text';
import { theme } from '../../theme';

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SelectField = ({
  label,
  value,
  options,
  onChange,
  disabled,
}: SelectFieldProps) => {
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
        style={[styles.field, disabled && { opacity: 0.5 }]}
      >
        <Text style={styles.value}>{selected ?? label}</Text>
        <ChevronDown size={16} color={theme.colors.muted} />
      </Pressable>
      <BottomSheet visible={open} title={label} onClose={() => setOpen(false)}>
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

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  value: { flex: 1, fontSize: 14, color: theme.colors.foreground },
  option: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
  },
  selected: { backgroundColor: 'hsla(340, 75%, 68%, 0.1)' },
});
