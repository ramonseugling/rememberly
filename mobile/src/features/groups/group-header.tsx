import { Share2, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { DsButton, DsText, tokens } from '../../design-system';
import { groupColors } from './group-palette';
import type { Group } from './model';

interface GroupHeaderProps {
  group: Group;
  subtitle: string;
  disabled?: boolean;
  onInvite: () => void;
}

export const GroupHeader = ({
  group,
  subtitle,
  disabled,
  onInvite,
}: GroupHeaderProps) => {
  const palette = groupColors(group.id);
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: palette.surface }]}>
        <Users size={30} color={palette.color} />
      </View>
      <View style={styles.copy}>
        <DsText role="title" style={styles.center}>
          {group.name}
        </DsText>
        <DsText role="caption" style={[styles.center, styles.muted]}>
          {subtitle}
        </DsText>
      </View>
      <DsButton
        label="Convidar"
        icon={<Share2 size={18} color={tokens.colors.onPrimary} />}
        disabled={disabled}
        onPress={onInvite}
        style={styles.invite}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { alignSelf: 'stretch', gap: 4 },
  center: { textAlign: 'center' },
  muted: { color: tokens.colors.textMuted },
  invite: { alignSelf: 'stretch' },
});
