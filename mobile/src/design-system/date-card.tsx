import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Cake,
  Calendar,
  Clock,
  Gift,
  Heart,
  MoreVertical,
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
  const urgent = !item.is_next_year && item.days_until <= 2;
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
        ? `${item.source.group_count} grupos`
        : item.source.group_name
      : null;
  const countdown = item.is_next_year
    ? `${item.days_until} dias`
    : daysLabel(item.days_until);
  const content = (
    <View style={styles.content}>
      <View style={styles.identity}>
        <View style={styles.icon}>
          <Icon size={20} color={tokens.colors.primary} />
        </View>
        <View style={styles.copy}>
          <DsText role="section" style={styles.title}>
            {item.title}
          </DsText>
          <DsText role="caption" style={styles.secondary}>
            {eventTypeLabel(item)}
          </DsText>
        </View>
        {onEdit && <MoreVertical size={18} color={tokens.colors.textMuted} />}
      </View>
      <View style={styles.metadata}>
        <View style={styles.detail}>
          <Calendar size={15} color={tokens.colors.textMuted} />
          <DsText role="caption" style={styles.secondary}>
            {item.event_day} de {monthNames[item.event_month - 1]}
          </DsText>
        </View>
        {group && (
          <View style={styles.detail}>
            <Users size={15} color={tokens.colors.textMuted} />
            <DsText role="caption" style={[styles.secondary, styles.group]}>
              {group}
            </DsText>
          </View>
        )}
        <View style={styles.countdown}>
          {item.is_next_year && (
            <Clock size={14} color={tokens.colors.textMuted} />
          )}
          <DsBadge label={countdown} tone={urgent ? 'primary' : 'neutral'} />
        </View>
      </View>
    </View>
  );
  return (
    <Pressable
      accessibilityRole={onEdit ? 'button' : undefined}
      accessibilityLabel={onEdit ? `Editar ${item.title}` : undefined}
      accessibilityState={onEdit ? { disabled: !!disabled } : undefined}
      disabled={!onEdit || disabled}
      onPress={onEdit}
      style={({ pressed }) => [
        styles.card,
        item.is_next_year && styles.nextYear,
        pressed && styles.pressed,
      ]}
    >
      {urgent ? (
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
  card: {
    borderRadius: tokens.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    minHeight: tokens.controlMinHeight,
  },
  nextYear: { backgroundColor: tokens.colors.surfaceMuted },
  pressed: { opacity: 0.85 },
  content: { padding: 20, gap: 16 },
  identity: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 16, lineHeight: 23 },
  secondary: { color: tokens.colors.textMuted },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  detail: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    maxWidth: '100%',
  },
  group: { flexShrink: 1 },
  countdown: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
