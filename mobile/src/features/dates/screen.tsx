import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  SectionList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Users,
} from 'lucide-react-native';
import {
  DsButton,
  DsAvatar,
  DsBrandHeader,
  DsChip,
  DsEmptyIcon,
  DsEmptyState,
  DsFeedback,
  DsSheet,
  DsText,
} from '../../design-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ApiError,
  useAuthenticatedApi,
  usePullRefresh,
  useResource,
} from '../../data/hooks';
import { DsDateCard } from '../../design-system/date-card';
import { dateSections } from './sections';
import { tokens } from '../../design-system/tokens';
import { useNotificationPrompt } from '../notifications';
import { EventEditor } from './event-editor';
import { eventIcon } from './event-icon';
import { editableEventId, eventTypeLabel, monthNames } from './model';
import type { Agenda, AgendaItem, EventPayload } from './model';

export function DatesScreen() {
  const params = useLocalSearchParams<{ eventId?: string | string[] }>();
  const [viewedId, setViewedId] = useState<string | null>(null);
  const listRef = useRef<SectionList<AgendaItem>>(null);
  const [expanded, setExpanded] = useState(false);
  const { data, loading, error, reload } = useResource<Agenda>(
    '/api/v1/mobile/agenda',
  );
  const { request } = useAuthenticatedApi();
  const pull = usePullRefresh();
  const [editor, setEditor] = useState<{ item?: AgendaItem } | null>(null);
  const [pending, setPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function openEditor(item?: AgendaItem) {
    if (busy.current || (item && !editableEventId(item))) return;
    setMutationError(null);
    setEditor({ item });
  }

  useEffect(() => {
    if (!data || typeof params.eventId !== 'string') return;
    const item = data.items.find((item) => item.id === params.eventId);
    setViewedId(item?.id ?? null);
    if (!item) setMutationError('Este evento não está mais disponível.');
    router.setParams({ eventId: undefined });
  }, [data, params.eventId]);
  useFocusEffect(
    useCallback(
      () => () => {
        setViewedId(null);
      },
      [],
    ),
  );
  const { maybePrompt, element: promptElement } = useNotificationPrompt();
  const viewed = data?.items.find((item) => item.id === viewedId);

  async function save(payload: EventPayload) {
    if (!mounted.current || busy.current) return;
    const id = editor?.item ? editableEventId(editor.item) : null;
    const firstEvent =
      !id && !data?.items.some((item) => item.source.kind === 'personal_event');
    if (editor?.item && !id) return;
    busy.current = true;
    setPending(true);
    setMutationError(null);
    try {
      await request(
        id ? `/api/v1/events/${encodeURIComponent(id)}` : '/api/v1/events',
        {
          method: id ? 'PATCH' : 'POST',
          body: payload,
        },
      );
      if (!mounted.current) return;
      setEditor(null);
      await reload();
      if (firstEvent) void maybePrompt();
    } catch (error) {
      if (
        mounted.current &&
        (!(error instanceof ApiError) ||
          !['stale', 'cancelled'].includes(error.kind))
      ) {
        setMutationError(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível salvar este evento. Tente novamente.',
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  function deleteItem(item: AgendaItem) {
    const id = editableEventId(item);
    if (!id || busy.current) return;
    void remove(id);
  }

  async function remove(id: string) {
    if (!mounted.current || busy.current) return;
    busy.current = true;
    setPending(true);
    setMutationError(null);
    try {
      await request(`/api/v1/events/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (mounted.current) {
        setEditor(null);
        await reload();
      }
    } catch (error) {
      if (
        mounted.current &&
        (!(error instanceof ApiError) ||
          !['stale', 'cancelled'].includes(error.kind))
      ) {
        setMutationError(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível excluir este evento. Tente novamente.',
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

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
        contentContainerStyle={[styles.content, isEmpty && styles.contentEmpty]}
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
                  disabled={pending}
                  onPress={() => openEditor()}
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
            {(error || (!editor && mutationError)) && (
              <View style={styles.errorCard}>
                <DsFeedback
                  message={error || mutationError || ''}
                  tone="error"
                />
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
          !loading && !error ? (
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
                onAction={() => openEditor()}
              />
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.cardSpacing}>
            <DsDateCard
              item={item}
              disabled={pending}
              onView={() =>
                item.source.kind === 'group_birthday'
                  ? router.navigate({
                      pathname: '/(tabs)/birthday',
                      params: { userId: item.source.user_id },
                    })
                  : setViewedId(item.id)
              }
            />
          </View>
        )}
      />
      {viewed && !editor && (
        <DsSheet visible title={viewed.title} onClose={() => setViewedId(null)}>
          <View style={styles.detail}>
            <DsAvatar name={viewed.title} size={64} />
            <View style={styles.detailInfo}>
              <View style={styles.detailRow}>
                {createElement(eventIcon(viewed.type), {
                  size: 18,
                  color: tokens.colors.brand,
                })}
                <DsText role="label">{eventTypeLabel(viewed)}</DsText>
              </View>
              <View style={styles.detailRow}>
                <Calendar size={18} color={tokens.colors.textMuted} />
                <DsText role="label">
                  {viewed.event_day} de {monthNames[viewed.event_month - 1]}
                </DsText>
              </View>
              {viewed.source.kind === 'group_birthday' && (
                <DsChip
                  label={viewed.source.group_name}
                  icon={<Users size={14} color={tokens.colors.textMuted} />}
                />
              )}
            </View>
          </View>
          {editableEventId(viewed) && (
            <DsButton
              label="Editar evento"
              style={styles.detailAction}
              onPress={() => {
                setViewedId(null);
                openEditor(viewed);
              }}
            />
          )}
        </DsSheet>
      )}
      {promptElement}
      {editor && (
        <EventEditor
          item={editor.item}
          pending={pending}
          error={mutationError}
          onClose={() => {
            if (!busy.current) {
              setEditor(null);
              setMutationError(null);
            }
          }}
          onDelete={
            editor.item
              ? () => {
                  if (editor.item) deleteItem(editor.item);
                }
              : undefined
          }
          onSave={(payload) => {
            void save(payload);
          }}
        />
      )}
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
  contentEmpty: { flexGrow: 1, justifyContent: 'center' },
  addButton: { marginTop: 6, minHeight: 52 },
});
