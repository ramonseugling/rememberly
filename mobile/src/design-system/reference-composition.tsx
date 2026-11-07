import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { DsDateCard } from './date-card';
import { DsRow } from './row/row';
import { DsText } from './text/text';
import { tokens } from './tokens';
import type { AgendaItem } from '../features/dates/model';

const exampleDates: AgendaItem[] = [
  { title: 'Marina', days: 0, day: 18 },
  { title: 'Rafael', days: 7, day: 25 },
  { title: 'Vó Lúcia', days: 12, day: 30 },
].map(({ title, days, day }, index) => ({
  id: `catalog-${index}`,
  source: { kind: 'personal_event', event_id: `catalog-${index}` },
  title,
  type: 'birthday',
  custom_type: null,
  event_day: day,
  event_month: 11,
  reminder_days_before: 0,
  next_date: `2026-11-${day}`,
  days_until: days,
  is_next_year: false,
  can_edit: false,
}));

interface ReferenceCompositionProps {
  onOpenExample: () => void;
}

export const ReferenceComposition = ({
  onOpenExample,
}: ReferenceCompositionProps) => (
  <LinearGradient colors={tokens.backgroundGradient} style={styles.preview}>
    <DsText role="title">Olá, Ana! 👋</DsText>
    <DsText role="caption" style={styles.muted}>
      Aqui estão suas próximas celebrações.
    </DsText>
    <DsText role="section" style={styles.section}>
      Próximos eventos
    </DsText>
    <View style={{ gap: 6 }}>
      {exampleDates.map((item) => (
        <DsDateCard key={item.id} item={item} onEdit={onOpenExample} />
      ))}
    </View>
    <DsText role="section" style={styles.section}>
      Meus grupos
    </DsText>
    <DsRow
      title="Família"
      subtitle="8 membros"
      leading={
        <View style={[styles.icon, styles.peach]}>
          <Users size={24} color={tokens.colors.family} />
        </View>
      }
      style={styles.group}
      trailing={<ChevronRight size={18} color={tokens.colors.textMuted} />}
    />
    <DsRow
      title="Amigos da faculdade"
      subtitle="12 membros"
      leading={
        <View style={styles.icon}>
          <Users size={24} color={tokens.colors.friends} />
        </View>
      }
      style={styles.group}
      trailing={<ChevronRight size={18} color={tokens.colors.textMuted} />}
    />
  </LinearGradient>
);

const styles = StyleSheet.create({
  preview: {
    padding: 0,
    gap: 8,
  },
  muted: { color: tokens.colors.textMuted },
  section: { marginTop: 12, marginBottom: 4 },
  group: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    boxShadow: tokens.shadows.card,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: tokens.colors.friendsSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peach: { backgroundColor: tokens.colors.familySurface },
});
