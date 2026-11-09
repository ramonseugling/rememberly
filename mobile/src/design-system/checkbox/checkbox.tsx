import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}
export const DsCheckbox = ({
  label,
  checked,
  onChange,
  disabled,
}: DsCheckboxProps) => (
  <Pressable
    accessibilityRole="checkbox"
    accessibilityLabel={label}
    accessibilityState={{ checked, disabled: !!disabled }}
    disabled={disabled}
    onPress={() => onChange(!checked)}
    style={[styles.row, disabled && { opacity: 0.45 }]}
  >
    {checked ? (
      <LinearGradient
        colors={tokens.actionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.box, styles.checked]}
      >
        <Check accessible={false} color={tokens.colors.onPrimary} size={16} />
      </LinearGradient>
    ) : (
      <View style={styles.box} />
    )}
    <DsText style={{ flex: 1 }}>{label}</DsText>
  </Pressable>
);
const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  box: {
    height: 24,
    width: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: tokens.colors.controlBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
  },
  checked: { borderWidth: 0 },
});
