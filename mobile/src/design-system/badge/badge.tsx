import { StyleSheet, View } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsBadgeProps {
  label: string;
  tone?: 'neutral' | 'primary' | 'soon' | 'success' | 'danger' | 'today';
}
export const DsBadge = ({ label, tone = 'neutral' }: DsBadgeProps) => {
  const color =
    tone === 'today'
      ? tokens.colors.todayText
      : tone === 'soon'
        ? tokens.colors.primary
        : tone === 'primary'
          ? tokens.colors.actionText
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
            tone === 'today'
              ? tokens.colors.todaySurface
              : tone === 'success'
                ? tokens.colors.successSurface
                : tone === 'danger'
                  ? tokens.colors.dangerSurface
                  : tone === 'primary' || tone === 'soon'
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
    borderRadius: 10,
    backgroundColor: tokens.colors.surfaceMuted,
  },
});
