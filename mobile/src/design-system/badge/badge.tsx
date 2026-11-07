import { StyleSheet, View } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsBadgeProps {
  label: string;
  tone?: 'neutral' | 'primary' | 'success' | 'danger';
}
export const DsBadge = ({ label, tone = 'neutral' }: DsBadgeProps) => {
  const color =
    tone === 'primary'
      ? tokens.colors.primary
      : tone === 'success'
        ? tokens.colors.success
        : tone === 'danger'
          ? tokens.colors.danger
          : tokens.colors.textMuted;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor:
            tone === 'success'
              ? tokens.colors.successSurface
              : tone === 'danger'
                ? tokens.colors.dangerSurface
                : tone === 'primary'
                  ? tokens.colors.iconSurface
                  : tokens.colors.surfaceMuted,
        },
      ]}
    >
      <DsText role="caption" style={{ color }}>
        {label}
      </DsText>
    </View>
  );
};
const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: tokens.colors.surfaceMuted,
  },
});
