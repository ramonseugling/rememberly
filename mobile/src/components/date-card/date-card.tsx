import { Pressable, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Cake,
  Calendar,
  Clock,
  Heart,
  PartyPopper,
  Gift,
  Users,
  MoreVertical,
} from 'lucide-react-native';
import { Text } from '../brand-text/brand-text';
import { theme } from '../../theme';
import {
  daysLabel,
  eventTypeLabel,
  monthNames,
  type AgendaItem,
} from '../../features/dates/model';

interface DateCardProps {
  item: AgendaItem;
  onEdit?: () => void;
  disabled?: boolean;
}

export const DateCard = ({ item, onEdit, disabled }: DateCardProps) => {
  const nextYear = item.is_next_year;
  const urgent = !nextYear && item.days_until <= 2;
  const accent =
    item.days_until <= 7
      ? theme.colors.primary
      : item.days_until <= 30
        ? theme.colors.accent
        : theme.colors.secondary;
  const tint =
    item.days_until <= 7
      ? 'hsla(340, 75%, 68%, 0.1)'
      : item.days_until <= 30
        ? 'hsla(25, 85%, 65%, 0.1)'
        : 'hsla(280, 65%, 70%, 0.1)';
  const color = urgent
    ? '#fff'
    : nextYear
      ? theme.colors.muted
      : theme.colors.foreground;
  const detailColor = urgent ? '#ffffffe6' : theme.colors.muted;
  const groupName =
    item.source.kind === 'group_birthday'
      ? item.source.group_count > 1
        ? `${item.source.group_count} grupos`
        : item.source.group_name
      : null;
  const Icon =
    item.type === 'birthday'
      ? Cake
      : item.type.includes('anniversary')
        ? Heart
        : item.type === 'celebration'
          ? PartyPopper
          : Gift;
  const content = (
    <View style={styles.content}>
      <View style={styles.row}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: urgent
                ? '#ffffff33'
                : nextYear
                  ? 'hsla(230, 25%, 50%, 0.1)'
                  : tint,
            },
          ]}
        >
          <Icon
            size={20}
            color={urgent ? '#fff' : nextYear ? theme.colors.muted : accent}
          />
        </View>
        <View style={styles.identity}>
          <Text style={[styles.title, { color }]}>{item.title}</Text>
          <Text style={[styles.type, { color: detailColor }]}>
            {eventTypeLabel(item)}
          </Text>
        </View>
        {onEdit && <MoreVertical color={detailColor} size={16} />}
      </View>
      <View style={styles.metadata}>
        {groupName && (
          <View
            style={[
              styles.group,
              {
                backgroundColor: urgent
                  ? '#ffffff33'
                  : theme.colors.mutedBackground,
              },
            ]}
          >
            <Users size={12} color={color} />
            <Text style={[styles.groupText, { color }]}>{groupName}</Text>
          </View>
        )}
        <View style={styles.date}>
          <Calendar size={14} color={detailColor} />
          <Text style={[styles.dateText, { color: detailColor }]}>
            {item.event_day} de {monthNames[item.event_month - 1]}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: urgent
                ? '#ffffff40'
                : nextYear
                  ? theme.colors.mutedBackground
                  : tint,
            },
          ]}
        >
          {nextYear && <Clock size={12} color={detailColor} />}
          <Text
            style={[
              styles.badgeText,
              {
                color: urgent ? '#fff' : nextYear ? theme.colors.muted : accent,
              },
            ]}
          >
            {nextYear
              ? item.days_until === 1
                ? 'Amanhã'
                : `${item.days_until} dias`
              : daysLabel(item.days_until)}
          </Text>
        </View>
      </View>
    </View>
  );
  return (
    <Pressable
      disabled={disabled || !onEdit}
      onPress={onEdit}
      accessibilityRole={onEdit ? 'button' : undefined}
      accessibilityState={onEdit ? { disabled: !!disabled } : undefined}
      accessibilityLabel={onEdit ? `Editar ${item.title}` : undefined}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: urgent
            ? 'transparent'
            : item.days_until <= 7
              ? theme.colors.primary
              : theme.colors.border,
        },
        nextYear && styles.nextYear,
        pressed && styles.pressed,
      ]}
    >
      {urgent ? (
        <LinearGradient
          colors={theme.gradient}
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
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.foreground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  nextYear: { backgroundColor: 'hsl(25, 45%, 97%)', opacity: 0.7 },
  pressed: { opacity: 0.85 },
  content: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  identity: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: theme.fonts.heading, fontSize: 16, lineHeight: 20 },
  type: { fontSize: 14, lineHeight: 18 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 8,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 99,
    maxWidth: '100%',
  },
  groupText: { fontSize: 12, flexShrink: 1 },
  date: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12 },
  badge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  badgeText: { fontSize: 12, fontFamily: theme.fonts.bold },
});
