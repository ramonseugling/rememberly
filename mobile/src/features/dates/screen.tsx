import { Text } from '../../components/brand-text/brand-text';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SectionList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, useAuthenticatedApi, useResource } from '../../data/hooks';
import { DateCard } from '../../components/date-card/date-card';
import { dateSections } from './sections';
import { useScreenAddAction } from '../../navigation/add-action';
import { theme } from '../../theme';
import { EventEditor } from './event-editor';
import {
  editableEventId,
  eventTypeLabel,
  occurrenceLabel,
  reminderLabel,
} from './model';
import type { Agenda, AgendaItem, EventPayload } from './model';

export function DatesScreen() {
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

  useScreenAddAction('Adicionar data', () => openEditor());

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
      if (mounted.current) await reload();
    } catch (error) {
      if (
        mounted.current &&
        (!(error instanceof ApiError) ||
          !['stale', 'cancelled'].includes(error.kind))
      ) {
        setMutationError(
          error instanceof ApiError
            ? error.message
            : 'Could not save this date. Please try again.',
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
      'Delete date?',
      `“${item.title}” will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
      if (mounted.current) await reload();
    } catch (error) {
      if (
        mounted.current &&
        (!(error instanceof ApiError) ||
          !['stale', 'cancelled'].includes(error.kind))
      ) {
        setMutationError(
          error instanceof ApiError
            ? error.message
            : 'Could not delete this date. Please try again.',
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  const grouped = dateSections(data?.items ?? [], expanded);
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SectionList
        sections={grouped.sections}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 20,
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            {section.title}
          </Text>
        )}
        ListFooterComponent={
          grouped.laterCount > 3 ? (
            <Pressable
              style={styles.control}
              onPress={() => setExpanded(!expanded)}
            >
              <Text>{expanded ? 'Mostrar menos' : 'Ver todas as datas'}</Text>
            </Pressable>
          ) : undefined
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              void reload();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.brand}>Rememberly</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Minhas Datas
            </Text>
            <Text style={styles.description}>
              As datas especiais de quem você ama, em um só lugar.
            </Text>
            {data && (
              <Text style={styles.description}>
                {grouped.upcomingCount} datas nos próximos 30 dias
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: pending }}
              disabled={pending}
              onPress={() => openEditor()}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Adicionar data</Text>
            </Pressable>
            {loading && !data && (
              <ActivityIndicator
                accessibilityLabel="Loading dates"
                color={theme.colors.foreground}
              />
            )}
            {(error || (!editor && mutationError)) && (
              <View style={styles.card}>
                <Text accessibilityRole="alert" style={styles.description}>
                  {error || mutationError}
                </Text>
                {error && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void reload();
                    }}
                    style={styles.control}
                  >
                    <Text style={styles.buttonText}>Tentar novamente</Text>
                  </Pressable>
                )}
              </View>
            )}
            {pending && !editor && (
              <ActivityIndicator
                accessibilityLabel="Updating dates"
                color={theme.colors.foreground}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.description}>
              No dates yet. Add your first date or join a group to see shared
              birthdays.
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={{ gap: 4 }}>
            <DateCard
              item={item}
              disabled={pending}
              onEdit={
                editableEventId(item) ? () => openEditor(item) : undefined
              }
            />
            {editableEventId(item) && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Excluir ${item.title}`}
                disabled={pending}
                onPress={() => confirmDelete(item)}
                style={{ padding: 12, minHeight: 44, alignSelf: 'flex-end' }}
              >
                <Text style={{ color: theme.colors.destructive }}>Excluir</Text>
              </Pressable>
            )}
          </View>
        )}
      />
      {editor && (
        <EventEditor
          item={editor.item}
          pending={pending}
          error={mutationError}
          onClose={() => {
            setEditor(null);
            setMutationError(null);
          }}
          onSave={(payload) => {
            void save(payload);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, gap: theme.spacing.medium },
  header: { gap: 16 },
  brand: { color: theme.colors.primary, fontSize: 18, fontWeight: '700' },
  title: {
    color: theme.colors.foreground,
    fontSize: 32,
    fontFamily: theme.fonts.heading,
  },
  description: { color: theme.colors.muted, fontSize: 16, lineHeight: 24 },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    color: theme.colors.foreground,
    fontSize: 21,
    fontWeight: '600',
  },
  date: { color: theme.colors.foreground, fontSize: 17 },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  control: {
    padding: 12,
    minHeight: 48,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
