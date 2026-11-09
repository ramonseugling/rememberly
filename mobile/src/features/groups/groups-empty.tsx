import { Plus, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import {
  DsAvatar,
  DsBrandHeader,
  DsEmptyState,
  tokens,
} from '../../design-system';

interface GroupsEmptyProps {
  userName: string;
  disabled?: boolean;
  onCreate: () => void;
}

export const GroupsEmpty = ({
  userName,
  disabled,
  onCreate,
}: GroupsEmptyProps) => (
  <View style={styles.wrap}>
    <DsBrandHeader />
    <DsEmptyState
      illustration={
        <View style={styles.stack}>
          <DsAvatar name={userName} size={56} style={styles.ring} />
          <View style={[styles.bubble, styles.pink, styles.overlap]}>
            <Users size={26} color={tokens.colors.brand} />
          </View>
          <View style={[styles.bubble, styles.gray, styles.overlap]}>
            <Plus size={22} color={tokens.colors.textMuted} />
          </View>
        </View>
      }
      title="Comemore junto de quem importa"
      description="Crie um grupo e compartilhe aniversários com família, amigos ou colegas."
      actionLabel="Criar meu primeiro grupo"
      onAction={disabled ? undefined : onCreate}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: 24 },
  stack: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center' },
  ring: {
    borderWidth: 3,
    borderColor: tokens.colors.surface,
    borderRadius: 28,
  },
  bubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlap: { marginLeft: -16 },
  pink: { backgroundColor: tokens.colors.iconSurface },
  gray: { backgroundColor: tokens.colors.surfaceMuted },
});
