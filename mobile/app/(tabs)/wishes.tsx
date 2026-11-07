import { Gift } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DsText, tokens } from '../../src/design-system';
export default function WishesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DsText role="title">Desejos</DsText>
      <View style={styles.empty}>
        <Gift size={48} color={tokens.colors.brand} />
        <DsText role="section">Em breve</DsText>
        <DsText style={styles.copy}>Sua lista de desejos estará aqui.</DsText>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20, backgroundColor: tokens.colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  copy: { textAlign: 'center', color: tokens.colors.textMuted },
});
