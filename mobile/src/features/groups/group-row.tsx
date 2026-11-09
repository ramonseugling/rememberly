import { ChevronRight, Share2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { DsText, tokens } from '../../design-system';
import { GroupAvatar } from './group-avatar';
import { groupSubtitle } from './group-subtitle';
import type { Group } from './model';

interface GroupRowProps {
  group: Group;
  disabled?: boolean;
  onOpen: () => void;
  onInvite: () => void;
}

export const GroupRow = ({
  group,
  disabled,
  onOpen,
  onInvite,
}: GroupRowProps) => {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver grupo ${group.name}`}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onOpen}
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.75 }]}
      >
        <GroupAvatar group={group} size={48} />
        <View style={styles.copy}>
          <DsText role="label" numberOfLines={2}>
            {group.name}
          </DsText>
          <DsText role="caption" style={{ color: tokens.colors.textMuted }}>
            {groupSubtitle(group)}
          </DsText>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Convidar para ${group.name}`}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onInvite}
        style={styles.invite}
      >
        <Share2 size={20} color={tokens.colors.actionText} />
      </Pressable>
      <ChevronRight size={20} color={tokens.colors.textMuted} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  invite: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.iconSurface,
  },
});
