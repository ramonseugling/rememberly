import { StyleSheet, Switch, View } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

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
    <View style={styles.target}>
      <Switch
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          true: tokens.colors.primary,
          false: tokens.colors.controlBorder,
        }}
        ios_backgroundColor={tokens.colors.controlBorder}
        thumbColor={tokens.colors.onPrimary}
        hitSlop={8}
      />
    </View>
  </View>
);
const styles = StyleSheet.create({
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  target: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
