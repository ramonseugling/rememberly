import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Cake,
  ChevronRight,
  Gift,
  Heart,
  PartyPopper,
  Users,
} from 'lucide-react-native';
import { DsBadge, DsText } from './index';
import { tokens } from './tokens';
import { daysLabel, eventTypeLabel } from '../features/dates/model';
import type { AgendaItem } from '../features/dates/model';

interface DsDateCardProps {
  item: AgendaItem;
  onEdit?: () => void;
  disabled?: boolean;
}

export const DsDateCard = ({ item, onEdit, disabled }: DsDateCardProps) => {
  const today = item.days_until === 0;
  const Icon =
    item.type === 'birthday'
      ? Cake
      : item.type.includes('anniversary')
        ? Heart
        : item.type === 'celebration'
          ? PartyPopper
          : Gift;
  const group =
    item.source.kind === 'group_birthday'
      ? item.source.group_count > 1
        ? item.source.group_count + ' grupos'
        : item.source.group_name
      : null;
  const countdown = item.is_next_year
    ? item.days_until + ' dias'
    : daysLabel(item.days_until);
  const content = (
    <View style={styles.content}>
      <View style={styles.avatar}>
        <DsText style={styles.initial}>
          {item.title.trim().charAt(0).toUpperCase()}
        </DsText>
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <DsText style={styles.title}>{item.title}</DsText>
          <DsBadge
            label={today ? 'Hoje 🎉' : countdown}
            tone={today ? 'today' : 'neutral'}
          />
        </View>
        <View style={styles.detail}>
          <Icon size={14} color={tokens.colors.brand} />
          <DsText role="caption" style={styles.secondary}>
            {eventTypeLabel(item)} · {item.event_day}/
            {String(item.event_month).padStart(2, '0')}
          </DsText>
        </View>
        {group && (
          <View style={styles.detail}>
            <Users size={12} color={tokens.colors.textMuted} />
            <DsText role="caption" style={[styles.secondary, styles.group]}>
              {group}
            </DsText>
          </View>
        )}
        {today && onEdit && (
          <View style={styles.todayAction}>
            <DsText role="caption" style={{ color: tokens.colors.primary }}>
              Editar data
            </DsText>
            <ChevronRight size={14} color={tokens.colors.primary} />
          </View>
        )}
      </View>
    </View>
  );
  return (
    <Pressable
      accessibilityRole={onEdit ? 'button' : undefined}
      accessibilityLabel={onEdit ? 'Editar ' + item.title : undefined}
      accessibilityState={onEdit ? { disabled: !!disabled } : undefined}
      disabled={!onEdit || disabled}
      onPress={onEdit}
      style={({ pressed }) => [
        styles.row,
        today && styles.today,
        pressed && styles.pressed,
      ]}
    >
      {today ? (
        <LinearGradient
          colors={tokens.celebration}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {content}
        </LinearGradient>
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
    minHeight: tokens.controlMinHeight,
    overflow: 'hidden',
  },
  today: {
    borderWidth: 1,
    borderRadius: tokens.radius.row,
    borderColor: tokens.colors.outlineBorder,
  },
  pressed: { opacity: 0.85 },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: tokens.colors.primary,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
  },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 8,
    rowGap: 4,
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  secondary: { color: tokens.colors.textMuted, fontSize: 12, lineHeight: 17 },
  detail: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    maxWidth: '100%',
  },
  group: { flexShrink: 1 },
  todayAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
});
