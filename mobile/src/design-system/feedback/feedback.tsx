import { StyleSheet, View } from 'react-native';
import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsFeedbackProps {
  message: string;
  tone?: 'error' | 'success' | 'info';
}
export const DsFeedback = ({ message, tone = 'info' }: DsFeedbackProps) => {
  const color =
    tone === 'error'
      ? tokens.colors.danger
      : tone === 'success'
        ? tokens.colors.success
        : tokens.colors.text;
  const Icon =
    tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle : Info;
  return (
    <View style={styles.feedback}>
      <Icon accessible={false} size={20} color={color} />
      <DsText
        accessibilityRole={tone === 'error' ? 'alert' : undefined}
        accessibilityLiveRegion="polite"
        style={{ flex: 1, color }}
      >
        {message}
      </DsText>
    </View>
  );
};
const styles = StyleSheet.create({
  feedback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: tokens.colors.surfaceMuted,
  },
});
