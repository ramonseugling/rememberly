import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { DsAvatar, DsBadge, DsText } from './index';
import { daysBadge } from './badge/days';
import { tokens } from './tokens';
import { eventTypeLabel } from '../features/dates/model';
import { eventIcon } from '../features/dates/event-icon';
import type { AgendaItem } from '../features/dates/model';
const shortMonths = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];
interface DsDateCardProps {
  item: AgendaItem;
  onView: () => void;
  disabled?: boolean;
}
export const DsDateCard = ({ item, onView, disabled }: DsDateCardProps) => {
  const today = item.days_until === 0;
  const dimmed = item.is_next_year && !today;
  const Icon = eventIcon(item.type);
  const personal = item.source.kind !== 'group_birthday';
  const shortDate = `${String(item.event_day).padStart(2, '0')} ${shortMonths[item.event_month - 1]}`;
  const badge = daysBadge(item.days_until, shortDate, item.is_next_year);
  const group =
    item.source.kind === 'group_birthday' ? item.source.group_name : null;
  const content = (
    <View style={styles.content}>
      <DsAvatar
        name={item.title}
        size={48}
        photoUri={item.avatar_url}
        fallback={
          personal ? (
            <Icon size={22} color={tokens.colors.onPrimary} />
          ) : undefined
        }
      />
      <View style={styles.copy}>
        <DsText
          style={[styles.title, dimmed && { color: tokens.colors.textMuted }]}
          numberOfLines={2}
        >
          {item.title}
        </DsText>
        <View style={styles.type}>
          {!personal && (
            <Icon
              size={16}
              color={dimmed ? tokens.colors.textMuted : tokens.colors.brand}
            />
          )}
          <DsText style={styles.subtitle} numberOfLines={2}>
            {eventTypeLabel(item)}
            {group ? ` · ${group}` : ''}
            {item.is_next_year ? ` · ${shortDate}` : ''}
          </DsText>
        </View>
      </View>
      <DsBadge label={badge.label} tone={badge.tone} />
      <ChevronRight size={20} color={tokens.colors.textMuted} />
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${eventTypeLabel(item)} de ${item.title}, ${badge.label}`}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onView}
      style={({ pressed }) => [
        styles.row,
        today && styles.today,
        dimmed && styles.dimmed,
        pressed && { opacity: 0.75 },
      ]}
    >
      {today ? (
        <LinearGradient colors={tokens.celebration}>{content}</LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
};
const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.row,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
    minHeight: 60,
    overflow: 'hidden',
  },
  today: { borderWidth: 0 },
  dimmed: {
    opacity: 0.6,
    backgroundColor: tokens.colors.background,
    boxShadow: 'none',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
  type: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subtitle: { fontSize: 14, color: tokens.colors.textMuted, flexShrink: 1 },
});
