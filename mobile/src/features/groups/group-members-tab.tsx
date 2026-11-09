import { Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { DsAvatar, DsText, tokens } from '../../design-system';
import { memberSubtitle } from './member-subtitle';
import { canRemoveMember, orderedMembers } from './model';
import type { GroupMember, GroupRole } from './model';

interface GroupMembersTabProps {
  members: GroupMember[];
  userId: string;
  role: GroupRole;
  disabled?: boolean;
  onRemove: (member: GroupMember) => void;
}

export const GroupMembersTab = ({
  members,
  userId,
  role,
  disabled,
  onRemove,
}: GroupMembersTabProps) => (
  <View style={styles.card}>
    <DsText role="section" accessibilityRole="header" style={styles.title}>
      Membros do grupo ({members.length})
    </DsText>
    {orderedMembers(members).map((member, index) => (
      <View key={member.id}>
        {index > 0 && <View style={styles.divider} />}
        <View style={styles.row}>
          <DsAvatar name={member.name} size={44} photoUri={member.avatar_url} />
          <View style={styles.grow}>
            <DsText role="label">
              {member.name}
              {member.id === userId ? ' (você)' : ''}
            </DsText>
            <DsText role="caption" style={styles.muted}>
              {memberSubtitle(member)}
            </DsText>
          </View>
          {canRemoveMember(role, userId, member) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remover ${member.name}`}
              accessibilityState={{ disabled: !!disabled }}
              disabled={disabled}
              onPress={() => onRemove(member)}
              style={styles.remove}
            >
              <Trash2 size={20} color={tokens.colors.danger} />
            </Pressable>
          )}
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 4,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  title: { fontSize: 18, lineHeight: 24, marginBottom: 8 },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  grow: { flex: 1, minWidth: 0 },
  muted: { color: tokens.colors.textMuted },
  divider: { height: 1, backgroundColor: tokens.colors.border },
  remove: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
