import { Share2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { DsButton, DsText, tokens } from '../../design-system';
import { GroupAvatar } from './group-avatar';
import type { Group } from './model';

interface GroupHeaderProps {
  group: Group;
  subtitle: string;
  disabled?: boolean;
  onInvite: () => void;
  onEditPhoto?: () => void;
}

export const GroupHeader = ({
  group,
  subtitle,
  disabled,
  onInvite,
  onEditPhoto,
}: GroupHeaderProps) => {
  return (
    <View style={styles.card}>
      <GroupAvatar group={group} size={64} onEdit={onEditPhoto} />
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
  copy: { alignSelf: 'stretch', gap: 4 },
  center: { textAlign: 'center' },
  muted: { color: tokens.colors.textMuted },
  invite: { alignSelf: 'stretch' },
});
