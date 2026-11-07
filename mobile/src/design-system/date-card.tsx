import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Cake,
  Calendar,
  ChevronRight,
  Clock,
  Gift,
  Heart,
  PartyPopper,
  Users,
} from 'lucide-react-native';
import { DsBadge, DsText } from './index';
import { tokens } from './tokens';
import { daysLabel, eventTypeLabel, monthNames } from '../features/dates/model';
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
          <DsBadge label={countdown} tone={today ? 'primary' : 'neutral'} />
        </View>
        <View style={styles.detail}>
          <Icon size={12} color={tokens.colors.primary} />
          <DsText role="caption" style={styles.secondary}>
            {eventTypeLabel(item)}
          </DsText>
        </View>
        <View style={styles.detail}>
          {item.is_next_year ? (
            <Clock size={12} color={tokens.colors.textMuted} />
          ) : (
            <Calendar size={12} color={tokens.colors.textMuted} />
          )}
          <DsText role="caption" style={styles.secondary}>
            {item.event_day} de {monthNames[item.event_month - 1]}
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
      </View>
      {onEdit && <ChevronRight size={16} color={tokens.colors.textMuted} />}
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
    borderBottomWidth: 1,
    borderColor: tokens.colors.border,
    minHeight: tokens.controlMinHeight,
    overflow: 'hidden',
  },
  today: {
    borderWidth: 1,
    borderRadius: 16,
    borderColor: tokens.colors.border,
  },
  pressed: { opacity: 0.85 },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    fontSize: 14,
    lineHeight: 20,
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
});
