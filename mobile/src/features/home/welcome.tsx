import { LinearGradient } from 'expo-linear-gradient';
import { CalendarPlus, Users } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';
import { DsListCard, DsText, tokens } from '../../design-system';

interface HomeWelcomeProps {
  onAddEvent: () => void;
  onCreateGroup: () => void;
}

// Shown when there are no events and no groups yet: one friendly start point
// instead of two separate empty blocks.
export const HomeWelcome = ({
  onAddEvent,
  onCreateGroup,
}: HomeWelcomeProps) => (
  <View style={styles.wrap}>
    <LinearGradient colors={tokens.celebration} style={styles.hero}>
      <Image
        source={require('../../../assets/brand/new-3d-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.copy}>
        <DsText role="section" style={styles.center}>
          Vamos começar?
        </DsText>
        <DsText style={[styles.center, styles.muted]}>
          Adicione datas importantes ou crie um grupo com seus amigos.
        </DsText>
      </View>
    </LinearGradient>
    <DsListCard
      title="Adicionar um evento"
      subtitle="Aniversários e datas importantes"
      icon={<CalendarPlus size={24} color={tokens.colors.brand} />}
      onPress={onAddEvent}
    />
    <DsListCard
      title="Criar um grupo"
      subtitle="Com família, amigos ou colegas"
      icon={<Users size={24} color={tokens.colors.brand} />}
      onPress={onCreateGroup}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  hero: {
    alignItems: 'center',
    gap: 10,
    padding: 20,
    marginBottom: 8,
    borderRadius: tokens.radius.row,
    boxShadow: tokens.shadows.card,
  },
  logo: { width: 104, height: 104 },
  copy: { gap: 4 },
  center: { textAlign: 'center' },
  muted: { color: tokens.colors.textMuted },
});
