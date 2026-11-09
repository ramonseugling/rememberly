import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsBackHeaderProps {
  label: string;
  onPress: () => void;
}

export const DsBackHeader = ({ label, onPress }: DsBackHeaderProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`Voltar para ${label}`}
    hitSlop={8}
    onPress={onPress}
    style={styles.back}
  >
    <ChevronLeft size={20} color={tokens.colors.brand} />
    <DsText
      role="caption"
      style={{
        color: tokens.colors.brand,
        fontFamily: tokens.fonts.bold,
        fontWeight: '600',
        fontSize: 14,
      }}
    >
      {label}
    </DsText>
  </Pressable>
);

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
    minHeight: tokens.controlMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
