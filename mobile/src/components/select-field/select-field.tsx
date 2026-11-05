import { useState } from 'react';
import { Modal, Pressable, ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronDown, X } from 'lucide-react-native';
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
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${options.find((option) => option.value === value)?.label ?? 'Selecione'}`}
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, disabled && { opacity: 0.5 }]}
      >
        <Text>
          {options.find((option) => option.value === value)?.label ?? label}
        </Text>
        <ChevronDown size={16} color={theme.colors.muted} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar seleção"
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView
            edges={['bottom', 'left', 'right']}
            style={styles.panel}
          >
            <View style={styles.header}>
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: 22 }}>
                {label}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar seleção"
                onPress={() => setOpen(false)}
                style={styles.close}
              >
                <X color={theme.colors.foreground} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
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
                  style={styles.option}
                >
                  <Text style={{ flex: 1 }}>{option.label}</Text>
                  {option.value === value && (
                    <Check color={theme.colors.primary} size={20} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
};
const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    minHeight: 48,
    padding: 12,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000055',
  },
  panel: {
    backgroundColor: theme.colors.background,
    maxHeight: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
});
