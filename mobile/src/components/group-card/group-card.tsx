import { Cake, ChevronRight, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { BrandButton } from '../brand-button/brand-button';
import { Text } from '../brand-text/brand-text';
import { daysLabel } from '../../features/groups/model';
import type { Group } from '../../features/groups/model';
import { theme } from '../../theme';

interface GroupCardProps {
  group: Group;
  pending: boolean;
  onOpen: () => void;
  onInvite: () => void;
}

export const GroupCard = ({
  group,
  pending,
  onOpen,
  onInvite,
}: GroupCardProps) => {
  const next = group.upcoming_birthdays?.[0];
  const date = next
    ? new Date(
        Date.UTC(2000, next.birth_month - 1, next.birth_day),
      ).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      })
    : '';
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver grupo ${group.name}`}
        accessibilityState={{ disabled: pending }}
        disabled={pending}
        onPress={onOpen}
        style={styles.cardContent}
      >
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>
              {group.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.grow}>
            <Text style={styles.name}>{group.name}</Text>
            <Text style={styles.body}>
              {group.member_count}{' '}
              {group.member_count === 1 ? 'membro' : 'membros'}
            </Text>
          </View>
        </View>
        <View style={styles.summary}>
          <Text style={styles.caption}>Próximo aniversário</Text>
          <View style={styles.birthday}>
            <View style={styles.cake}>
              <Cake
                size={17}
                color={next ? theme.colors.primary : theme.colors.muted}
              />
            </View>
            <View style={styles.grow}>
              <Text style={[styles.nextName, !next && styles.muted]}>
                {next?.name ?? 'Nenhum evento próximo'}
              </Text>
              <Text style={styles.caption}>
                {next ? date : 'Tudo em dia! 🎉'}
              </Text>
            </View>
            {next && (
              <Text style={styles.badge}>{daysLabel(next.days_until)}</Text>
            )}
          </View>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <BrandButton
          label="Ver grupo"
          variant="outline"
          onPress={onOpen}
          disabled={pending}
          icon={<ChevronRight size={16} color={theme.colors.foreground} />}
          style={styles.grow}
        />
        <BrandButton
          label="Convidar"
          variant="solid"
          onPress={onInvite}
          disabled={pending}
          icon={<Plus size={16} color="white" />}
          style={styles.grow}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContent: { gap: 16 },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    boxShadow: '0 2px 2px rgba(45, 40, 70, 0.10)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(235, 109, 151, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    color: theme.colors.primary,
  },
  name: {
    fontFamily: theme.fonts.heading,
    fontSize: 16,
    color: theme.colors.foreground,
  },
  body: { color: theme.colors.muted, fontSize: 14 },
  summary: { gap: 8 },
  caption: { color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  birthday: {
    backgroundColor: 'rgba(245, 239, 234, 0.45)',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  cake: {
    width: 36,
    height: 36,
    backgroundColor: theme.colors.mutedBackground,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextName: {
    fontFamily: theme.fonts.heading,
    fontSize: 14,
    color: theme.colors.foreground,
  },
  muted: { color: theme.colors.muted },
  badge: {
    fontSize: 12,
    color: theme.colors.primary,
    backgroundColor: 'rgba(235, 109, 151, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  actions: { flexDirection: 'row', gap: 8 },
});
