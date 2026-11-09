import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AccessibilityState } from 'react-native';
import { tokens } from '../tokens';

interface DsToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  accessibilityState?: AccessibilityState;
  disabled?: boolean;
}

export const DsToggle = ({
  value,
  onValueChange,
  accessibilityLabel,
  accessibilityState,
  disabled,
}: DsToggleProps) => (
  <Pressable
    accessibilityRole="switch"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{
      ...accessibilityState,
      checked: value,
      disabled: !!disabled,
    }}
    disabled={disabled}
    onPress={() => onValueChange(!value)}
    style={[styles.target, disabled && { opacity: 0.45 }]}
  >
    {value ? (
      <LinearGradient
        colors={tokens.actionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.track, styles.on]}
      >
        <View style={styles.thumb} />
      </LinearGradient>
    ) : (
      <View style={[styles.track, styles.off]}>
        <View style={styles.thumb} />
      </View>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  target: {
    width: 56,
    minHeight: tokens.controlMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  on: { alignItems: 'flex-end' },
  off: {
    alignItems: 'flex-start',
    backgroundColor: tokens.colors.controlBorder,
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: tokens.colors.onPrimary,
  },
});
