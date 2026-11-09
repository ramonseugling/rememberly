import { StyleSheet, View } from 'react-native';
import { DsText } from '../text/text';
import { DsToggle } from '../toggle/toggle';

interface DsSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}
export const DsSwitch = ({
  label,
  value,
  onValueChange,
  disabled,
}: DsSwitchProps) => (
  <View style={styles.row}>
    <DsText style={{ flex: 1 }}>{label}</DsText>
    <DsToggle
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    />
  </View>
);
const styles = StyleSheet.create({
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
