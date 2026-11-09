import { LinearGradient } from 'expo-linear-gradient';
import {
  Cake,
  ChevronRight,
  Gift,
  Heart,
  PartyPopper,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { DsAvatar, DsBadge, DsText } from './index';
import { daysBadge } from './badge/days';
import { tokens } from './tokens';
import { eventTypeLabel } from '../features/dates/model';
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
  const Icon =
    item.type === 'birthday'
      ? Cake
      : item.type.includes('anniversary')
        ? Heart
        : item.type === 'celebration'
          ? PartyPopper
          : Gift;
  const badge = daysBadge(
    item.days_until,
    `${String(item.event_day).padStart(2, '0')} ${shortMonths[item.event_month - 1]}`,
  );
  const group =
    item.source.kind === 'group_birthday' ? item.source.group_name : null;
  const content = (
    <View style={styles.content}>
      <DsAvatar name={item.title} size={56} />
      <View style={styles.copy}>
        <DsText style={styles.title} numberOfLines={2}>
          {item.title}
        </DsText>
        <View style={styles.type}>
          <Icon size={16} color={tokens.colors.brand} />
          <DsText style={styles.subtitle} numberOfLines={2}>
            {eventTypeLabel(item)}
            {group ? ` · ${group}` : ''}
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
    minHeight: 80,
    overflow: 'hidden',
  },
  today: { borderColor: tokens.colors.outlineBorder },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
  type: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subtitle: { fontSize: 14, color: tokens.colors.textMuted, flexShrink: 1 },
});
