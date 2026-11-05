import { Pressable, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Cake,
  Calendar,
  Heart,
  PartyPopper,
  Sparkles,
  Users,
  MoreVertical,
} from 'lucide-react-native';
import { Text } from '../brand-text/brand-text';
import { theme } from '../../theme';
import { eventTypeLabel, type AgendaItem } from '../../features/dates/model';

interface DateCardProps {
  item: AgendaItem;
  onEdit?: () => void;
  disabled?: boolean;
}
const months = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
export const DateCard = ({ item, onEdit, disabled }: DateCardProps) => {
  const urgent = item.days_until <= 2;
  const accent =
    item.days_until <= 7
      ? theme.colors.primary
      : item.days_until <= 30
        ? theme.colors.accent
        : theme.colors.secondary;
  const color = urgent ? '#fff' : theme.colors.foreground;
  const Icon =
    item.type === 'birthday'
      ? Cake
      : item.type.includes('anniversary')
        ? Heart
        : item.type === 'celebration'
          ? PartyPopper
          : Sparkles;
  const content = (
    <View style={styles.content}>
      <View style={styles.row}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: urgent
                ? '#ffffff30'
                : theme.colors.mutedBackground,
            },
          ]}
        >
          <Icon size={23} color={urgent ? '#fff' : accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color }]}>{item.title}</Text>
          <Text style={{ color: urgent ? '#ffffffe0' : theme.colors.muted }}>
            {eventTypeLabel(item)}
          </Text>
        </View>
        {onEdit && <MoreVertical color={color} size={20} />}
      </View>
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        <Calendar size={14} color={color} />
        <Text style={{ fontSize: 13, color }}>
          {item.event_day} de {months[item.event_month - 1]}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: urgent
                ? '#ffffff30'
                : theme.colors.mutedBackground,
            },
          ]}
        >
          <Text
            style={{
              fontSize: 12,
              color: urgent ? '#fff' : accent,
              fontFamily: theme.fonts.bold,
            }}
          >
            {item.days_until === 0
              ? 'Hoje!'
              : item.days_until === 1
                ? 'Amanhã'
                : `Em ${item.days_until} dias`}
          </Text>
        </View>
      </View>
      {item.source.kind === 'group_birthday' && (
        <View style={styles.row}>
          <Users size={13} color={color} />
          <Text style={{ fontSize: 12, color }}>
            {item.source.group_count > 1
              ? `${item.source.group_count} grupos`
              : item.source.group_name}
          </Text>
        </View>
      )}
      {item.is_next_year && (
        <Text style={{ fontSize: 12, color: theme.colors.muted }}>
          No próximo ano
        </Text>
      )}
    </View>
  );
  return (
    <Pressable
      disabled={disabled || !onEdit}
      onPress={onEdit}
      accessibilityRole={onEdit ? 'button' : undefined}
      accessibilityLabel={onEdit ? `Editar ${item.title}` : undefined}
      style={[
        styles.card,
        { borderColor: urgent ? 'transparent' : theme.colors.border },
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
    backgroundColor: '#fff',
  },
  content: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: theme.fonts.heading, fontSize: 17 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
});
