import { useState } from 'react';
import { Cake } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../brand-text/brand-text';
import { BrandButton } from '../brand-button/brand-button';
import {
  birthdayLabel,
  daysLabel,
  orderedBirthdays,
} from '../../features/groups/model';
import type { GroupMember } from '../../features/groups/model';
import { theme } from '../../theme';

interface GroupDatesProps {
  members: GroupMember[];
  userId: string;
  currentMonth: number;
}

export const GroupDates = ({
  members,
  userId,
  currentMonth,
}: GroupDatesProps) => {
  const [expanded, setExpanded] = useState(false);
  const birthdays = orderedBirthdays(members);
  const next = birthdays[0];
  const visible = expanded ? birthdays : birthdays.slice(0, 5);
  if (!next)
    return (
      <View style={styles.card}>
        <Text style={styles.body}>
          Ninguém do grupo cadastrou data de aniversário ainda.
        </Text>
      </View>
    );
  return (
    <View style={styles.stack}>
      <View style={styles.highlight}>
        <Text style={styles.eyebrow}>Próxima data</Text>
        <View style={styles.row}>
          <View style={styles.icon}>
            <Cake size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.grow}>
            <Text style={styles.heading}>{next.name}</Text>
            <Text style={styles.caption}>{birthdayLabel(next)}</Text>
          </View>
          <Text style={styles.badge}>{daysLabel(next.daysUntil!)}</Text>
        </View>
      </View>
      <View style={styles.monthCard}>
        <Text style={styles.accent}>Aniversários neste mês</Text>
        <View style={styles.row}>
          <View style={styles.grow}>
            <Text style={styles.count}>
              {
                birthdays.filter(
                  (member) => member.birth_month === currentMonth,
                ).length
              }
            </Text>
            <Text style={styles.caption}>pessoas 🎉</Text>
          </View>
          <Text style={styles.emoji} accessibilityElementsHidden>
            🧁
          </Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>
          Próximos aniversários
        </Text>
        {visible.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.birthday,
              index < visible.length - 1 && styles.divider,
            ]}
          >
            <View style={styles.smallIcon}>
              <Cake size={17} color={theme.colors.primary} />
            </View>
            <View style={styles.grow}>
              <Text style={styles.body}>
                {member.name}
                {member.id === userId ? ' (você)' : ''}
              </Text>
              {member.role === 'owner' && (
                <Text style={styles.owner}>Criador</Text>
              )}
              <Text style={styles.caption}>{birthdayLabel(member)}</Text>
            </View>
            <Text style={[styles.badge, member.daysUntil! > 7 && styles.later]}>
              {daysLabel(member.daysUntil!)}
            </Text>
          </View>
        ))}
        {birthdays.length > 5 && (
          <BrandButton
            variant="outline"
            label={expanded ? 'Ver menos' : 'Ver todas as datas'}
            onPress={() => setExpanded((value) => !value)}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  grow: { flex: 1, minWidth: 110 },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 20,
    gap: 4,
  },
  heading: {
    fontFamily: theme.fonts.heading,
    fontSize: 16,
    color: theme.colors.foreground,
  },
  body: { fontSize: 14, color: theme.colors.foreground, lineHeight: 20 },
  caption: { fontSize: 12, color: theme.colors.muted, lineHeight: 18 },
  highlight: {
    padding: 16,
    backgroundColor: 'rgba(235, 109, 151, 0.10)',
    borderRadius: 16,
    gap: 8,
  },
  eyebrow: { fontSize: 12, color: theme.colors.primary },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(235, 109, 151, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(235, 109, 151, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    fontSize: 12,
    color: theme.colors.primary,
    backgroundColor: 'rgba(235, 109, 151, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  later: {
    color: theme.colors.accent,
    backgroundColor: 'rgba(242, 149, 90, 0.15)',
  },
  birthday: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 12,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  monthCard: {
    padding: 16,
    gap: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(242, 149, 90, 0.10)',
  },
  accent: { color: theme.colors.accent, fontSize: 12 },
  count: {
    fontSize: 30,
    fontFamily: theme.fonts.heading,
    color: theme.colors.foreground,
  },
  emoji: { fontSize: 32 },
  owner: {
    alignSelf: 'flex-start',
    color: theme.colors.primary,
    backgroundColor: 'rgba(235, 109, 151, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 8,
    fontSize: 10,
    marginVertical: 3,
  },
});
