import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DsAvatar,
  DsButton,
  DsDaysBadge,
  DsGradientText,
  DsText,
  tokens,
} from '../../design-system';
import { birthdayDateLabel, birthdaysInMonth, orderedBirthdays } from './model';
import type { GroupMember } from './model';

interface GroupEventsTabProps {
  members: GroupMember[];
  userId: string;
  currentMonth: number;
}

const VISIBLE = 5;

export const GroupEventsTab = ({
  members,
  userId,
  currentMonth,
}: GroupEventsTabProps) => {
  const [expanded, setExpanded] = useState(false);
  const birthdays = orderedBirthdays(members);
  const next = birthdays[0];
  const month = birthdaysInMonth(birthdays, currentMonth);
  const visible = expanded ? birthdays : birthdays.slice(0, VISIBLE);
  if (!next)
    return (
      <View style={styles.card}>
        <DsText>Ninguém do grupo cadastrou data de aniversário ainda.</DsText>
      </View>
    );
  return (
    <View style={styles.stack}>
      <LinearGradient colors={tokens.celebration} style={styles.next}>
        <DsText role="caption" style={styles.eyebrow}>
          Próximo evento
        </DsText>
        <View style={styles.row}>
          <DsAvatar name={next.name} size={48} />
          <View style={styles.grow}>
            <DsText role="section" style={styles.nextName}>
              {next.name}
            </DsText>
            <DsText role="caption" style={styles.muted}>
              {birthdayDateLabel(next)}
            </DsText>
          </View>
          <DsDaysBadge days={next.daysUntil!} />
        </View>
      </LinearGradient>
      <View style={styles.card}>
        <DsText role="caption" style={styles.accent}>
          Aniversários neste mês
        </DsText>
        <View style={styles.monthRow}>
          <View style={styles.count}>
            <DsText style={styles.countValue}>{month.length}</DsText>
            <DsText role="caption" style={styles.muted}>
              {month.length === 1 ? 'pessoa' : 'pessoas'} 🎉
            </DsText>
          </View>
          <View style={styles.stackAvatars}>
            {month.slice(0, 2).map((member, index) => (
              <DsAvatar
                key={member.id}
                name={member.name}
                size={48}
                style={[styles.ring, index > 0 && styles.overlap]}
              />
            ))}
            {month.length > 2 && (
              <View style={[styles.more, styles.overlap]}>
                <DsText role="caption" style={styles.moreText}>
                  +{month.length - 2}
                </DsText>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.card}>
        <DsText role="section" style={styles.listTitle}>
          Próximos aniversários
        </DsText>
        {visible.map((member, index) => (
          <View key={member.id}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.listRow}>
              <DsAvatar name={member.name} size={36} />
              <View style={styles.grow}>
                <DsText role="label">
                  {member.name}
                  {member.id === userId ? ' (você)' : ''}
                </DsText>
                {member.role === 'owner' && (
                  <DsGradientText style={styles.owner}>Criador</DsGradientText>
                )}
                <DsText role="caption" style={styles.muted}>
                  {birthdayDateLabel(member)}
                </DsText>
              </View>
              <DsDaysBadge days={member.daysUntil!} />
            </View>
          </View>
        ))}
        {birthdays.length > VISIBLE && (
          <DsButton
            variant="outline"
            label={expanded ? 'Ver menos' : 'Ver todos os eventos'}
            onPress={() => setExpanded((value) => !value)}
            style={styles.expand}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: 16 },
  card: {
    padding: 16,
    gap: 6,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  next: {
    padding: 16,
    gap: 10,
    borderRadius: tokens.radius.card,
    boxShadow: tokens.shadows.card,
  },
  eyebrow: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.fonts.bold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  nextName: { fontSize: 18, lineHeight: 24 },
  muted: { color: tokens.colors.textMuted },
  accent: {
    color: tokens.colors.actionText,
    fontFamily: tokens.fonts.bold,
    fontWeight: '700',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  countValue: {
    fontFamily: tokens.fonts.headingBold,
    fontWeight: '700',
    fontSize: 36,
    lineHeight: 40,
  },
  stackAvatars: { flexDirection: 'row', alignItems: 'center' },
  ring: {
    borderWidth: 3,
    borderColor: tokens.colors.surface,
    borderRadius: 24,
  },
  overlap: { marginLeft: -14 },
  more: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceMuted,
  },
  moreText: { fontFamily: tokens.fonts.bold, fontWeight: '700', fontSize: 14 },
  listTitle: { fontSize: 18, lineHeight: 24, marginBottom: 8 },
  listRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: { height: 1, backgroundColor: tokens.colors.border },
  owner: {
    fontFamily: tokens.fonts.bold,
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
  },
  expand: { marginTop: 8 },
});
