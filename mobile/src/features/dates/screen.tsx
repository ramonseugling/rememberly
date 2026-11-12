import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  SectionList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Calendar, ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import {
  DsButton,
  DsBrandHeader,
  DsEmptyIcon,
  DsEmptyState,
  DsFeedback,
  DsText,
} from '../../design-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePullRefresh, useResource } from '../../data/hooks';
import { DsDateCard } from '../../design-system/date-card';
import { birthdayRoute } from '../gifts/birthday-route';
import { dateSections } from './sections';
import { tokens } from '../../design-system/tokens';
import type { Agenda, AgendaItem } from './model';

export function DatesScreen() {
  const params = useLocalSearchParams<{ eventId?: string | string[] }>();
  const listRef = useRef<SectionList<AgendaItem>>(null);
  const [expanded, setExpanded] = useState(false);
  const { data, loading, error, reload } = useResource<Agenda>(
    '/api/v1/mobile/agenda',
  );
  const pull = usePullRefresh();

  function openEvent(item: AgendaItem) {
    if (item.source.kind === 'group_birthday') {
      router.navigate(birthdayRoute(item.source.user_id, 'events'));
      return;
    }
    router.navigate({
      pathname: '/(tabs)/event',
      params: { id: item.id, mode: 'view' },
    });
  }
  function addEvent() {
    router.navigate({ pathname: '/(tabs)/event', params: { mode: 'new' } });
  }

  useEffect(() => {
    if (!data || typeof params.eventId !== 'string') return;
    const item = data.items.find((entry) => entry.id === params.eventId);
    router.setParams({ eventId: undefined });
    if (item) openEvent(item);
  }, [data, params.eventId]);

  const grouped = dateSections(data?.items ?? [], expanded, data?.today);
  const isEmpty = !!data && !error && data.items.length === 0;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SectionList
        ref={listRef}
        sections={grouped.sections}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeading}>
            <DsText
              accessibilityRole="header"
              role="section"
              style={styles.sectionTitle}
            >
              {section.title}
            </DsText>
          </View>
        )}
        renderSectionFooter={() => <View style={{ height: 16 }} />}
        ListFooterComponent={
          grouped.laterCount > 3 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              style={styles.expand}
              onPress={() => setExpanded(!expanded)}
            >
              <DsText role="label">
                {expanded ? 'Ver menos eventos' : 'Ver todos os eventos'}
              </DsText>
              {expanded ? (
                <ChevronUp size={18} color={tokens.colors.text} />
              ) : (
                <ChevronDown size={18} color={tokens.colors.text} />
              )}
            </Pressable>
          ) : undefined
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
            refreshing={pull.refreshing}
            onRefresh={() => {
              pull.run(reload);
            }}
          />
        }
        ListHeaderComponent={
          <View>
            {!isEmpty && (
              <View style={styles.header}>
                <DsText
                  accessibilityRole="header"
                  role="title"
                  style={styles.title}
                >
                  Eventos
                </DsText>
                <DsText role="caption" style={styles.description}>
                  Acompanhe suas celebrações em ordem cronológica.
                </DsText>
                <DsButton
                  label="Adicionar evento"
                  icon={<Plus size={20} color={tokens.colors.onPrimary} />}
                  onPress={addEvent}
                  style={styles.addButton}
                />
              </View>
            )}
            {loading && !data && (
              <ActivityIndicator
                accessibilityLabel="Carregando eventos"
                color={tokens.colors.primary}
              />
            )}
            {error && (
              <View style={styles.errorCard}>
                <DsFeedback message={error || ''} tone="error" />
                {error && (
                  <DsButton
                    variant="outline"
                    label="Tentar novamente"
                    onPress={() => {
                      void reload();
                    }}
                  />
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          isEmpty ? (
            <View style={styles.emptyContainer}>
              <DsBrandHeader />
              <DsEmptyState
                illustration={
                  <DsEmptyIcon size={72} gradient>
                    <Calendar size={32} color={tokens.colors.onPrimary} />
                  </DsEmptyIcon>
                }
                title="Nenhum evento por aqui"
                description="Cadastre aniversários e datas importantes e receba um aviso no dia de cada um."
                actionLabel="Adicionar meu primeiro evento"
                actionIcon={<Plus size={20} color={tokens.colors.onPrimary} />}
                onAction={addEvent}
              />
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.cardSpacing}>
            <DsDateCard item={item} onView={() => openEvent(item)} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: tokens.tabBarClearance,
  },
  header: { gap: 6, marginBottom: 24 },
  title: {
    fontSize: tokens.typography.title.fontSize,
    lineHeight: tokens.typography.title.lineHeight,
    fontWeight: '700',
  },
  description: { color: tokens.colors.textMuted },
  sectionHeading: { marginBottom: 10, marginTop: 8 },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 26,
  },
  detailAction: { minHeight: 52 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  detailInfo: { flex: 1, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardSpacing: { marginBottom: 8 },
  expand: {
    alignSelf: 'center',
    minHeight: tokens.controlMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: tokens.radius.control,
    borderWidth: 1,
    borderColor: tokens.colors.controlBorder,
  },
  errorCard: { gap: 12, marginBottom: 24 },
  emptyContainer: { gap: 24 },
  addButton: { marginTop: 6, minHeight: 52 },
});
