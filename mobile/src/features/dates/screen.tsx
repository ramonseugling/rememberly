import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  SectionList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {
  Cake,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react-native';
import {
  DsButton,
  DsCard,
  DsFeedback,
  DsSheet,
  DsText,
} from '../../design-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, useAuthenticatedApi, useResource } from '../../data/hooks';
import { DsDateCard } from '../../design-system/date-card';
import { dateSections } from './sections';
import { tokens } from '../../design-system/tokens';
import { EventEditor } from './event-editor';
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
  const viewed = data?.items.find((item) => item.id === viewedId);

  async function save(payload: EventPayload) {
    if (!mounted.current || busy.current) return;
    const id = editor?.item ? editableEventId(editor.item) : null;
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
    } catch (error) {
      if (
        mounted.current &&
        (!(error instanceof ApiError) ||
          !['stale', 'cancelled'].includes(error.kind))
      ) {
        setMutationError(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível salvar esta data. Tente novamente.',
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  function confirmDelete(item: AgendaItem) {
    const id = editableEventId(item);
    if (!id || busy.current) return;
    Alert.alert(
      'Excluir data?',
      `“${item.title}” será removida permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void remove(id);
          },
        },
      ],
    );
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
            : 'Não foi possível excluir esta data. Tente novamente.',
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  const grouped = dateSections(data?.items ?? [], expanded, data?.today);
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
                {expanded ? 'Ver menos datas' : 'Ver todas as datas'}
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
            refreshing={loading}
            onRefresh={() => {
              void reload();
            }}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <DsText
                  accessibilityRole="header"
                  role="title"
                  style={styles.title}
                >
                  Eventos
                </DsText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar evento"
                  accessibilityState={{ disabled: pending }}
                  disabled={pending}
                  onPress={() => openEditor()}
                  style={styles.addIcon}
                >
                  <Calendar size={26} color={tokens.colors.text} />
                </Pressable>
              </View>
              <DsText style={styles.description}>
                Acompanhe suas celebrações em ordem cronológica.
              </DsText>
            </View>
            {loading && !data && (
              <ActivityIndicator
                accessibilityLabel="Carregando datas"
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
              <DsCard style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Calendar size={44} color={tokens.colors.primary} />
                </View>
                <DsText
                  accessibilityRole="header"
                  role="section"
                  style={styles.centered}
                >
                  Nenhuma data por aqui ainda
                </DsText>
                <DsText style={[styles.description, styles.centered]}>
                  Adicione aniversários e outras datas importantes para receber
                  lembretes no momento certo.
                </DsText>
                <DsButton
                  label="Adicionar primeira data"
                  icon={<Plus size={18} color={tokens.colors.onPrimary} />}
                  onPress={() => openEditor()}
                  disabled={pending}
                />
              </DsCard>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.cardSpacing}>
            <DsDateCard
              item={item}
              disabled={pending}
              onView={() => setViewedId(item.id)}
            />
          </View>
        )}
      />
      {viewed && !editor && (
        <DsSheet visible title={viewed.title} onClose={() => setViewedId(null)}>
          <DsText>{eventTypeLabel(viewed)}</DsText>
          <DsText>
            {viewed.event_day} de {monthNames[viewed.event_month - 1]}
          </DsText>
          {viewed.source.kind === 'group_birthday' && (
            <DsText>{viewed.source.group_name}</DsText>
          )}
          {editableEventId(viewed) && (
            <DsButton
              label="Editar evento"
              onPress={() => {
                setViewedId(null);
                openEditor(viewed);
              }}
            />
          )}
        </DsSheet>
      )}
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
                  if (editor.item) confirmDelete(editor.item);
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
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 },
  header: { gap: 6, marginBottom: 24 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addIcon: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: tokens.typography.title.fontSize,
    lineHeight: tokens.typography.title.lineHeight,
    fontWeight: '700',
  },
  description: { color: tokens.colors.textMuted, fontSize: 16, lineHeight: 23 },
  sectionHeading: { marginBottom: 10, marginTop: 8 },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 26,
  },
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
  emptyContainer: { gap: 12 },
  empty: { alignItems: 'center', gap: 16 },
  emptyIcon: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { textAlign: 'center' },
});
