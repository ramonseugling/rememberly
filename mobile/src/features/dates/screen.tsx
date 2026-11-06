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
import {
  Cake,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  PartyPopper,
  Plus,
  Bell,
  Star,
} from 'lucide-react-native';
import { BrandButton } from '../../components/brand-button/brand-button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, useAuthenticatedApi, useResource } from '../../data/hooks';
import { DateCard } from '../../components/date-card/date-card';
import { dateSections } from './sections';
import { useScreenAddAction } from '../../navigation/add-action';
import { theme } from '../../theme';
import { EventEditor } from './event-editor';
import { editableEventId, monthNames } from './model';
import type { Agenda, AgendaItem, EventPayload } from './model';

export function DatesScreen() {
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

  const grouped = dateSections(data?.items ?? [], expanded);
  const withinWeek =
    data?.items.filter((item) => item.days_until <= 7).length ?? 0;
  const monthName = data ? monthNames[Number(data.today.slice(5, 7)) - 1] : '';
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SectionList
        ref={listRef}
        sections={grouped.sections}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => {
          const Icon =
            section.title === 'Próximos 7 dias'
              ? Calendar
              : section.title === 'Este mês'
                ? Cake
                : Clock;
          const color =
            section.title === 'Próximos 7 dias'
              ? theme.colors.primary
              : section.title === 'Este mês'
                ? theme.colors.accent
                : theme.colors.secondary;
          return (
            <View style={styles.sectionHeading}>
              <Icon size={16} color={color} />
              <Text
                accessibilityRole="header"
                style={[styles.sectionTitle, { color }]}
              >
                {section.title}
              </Text>
            </View>
          );
        }}
        renderSectionFooter={() => <View style={{ height: 16 }} />}
        ListFooterComponent={
          grouped.laterCount > 3 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              style={styles.expand}
              onPress={() => setExpanded(!expanded)}
            >
              <Text style={styles.expandText}>
                {expanded ? 'Ver menos datas' : 'Ver todas as datas'}
              </Text>
              {expanded ? (
                <ChevronUp color={theme.colors.foreground} size={16} />
              ) : (
                <ChevronDown color={theme.colors.foreground} size={16} />
              )}
            </Pressable>
          ) : undefined
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            refreshing={loading}
            onRefresh={() => {
              void reload();
            }}
          />
        }
        ListHeaderComponent={
          <View>
            {(loading || error || !!data?.items.length) && (
              <View style={styles.header}>
                <Text style={styles.eyebrow}>Minhas Datas</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  Próximas datas importantes
                </Text>
                {data && (
                  <Text style={styles.description}>
                    {monthName} • {grouped.upcomingCount}{' '}
                    {grouped.upcomingCount === 1 ? 'evento' : 'eventos'} nos
                    próximos 30 dias
                  </Text>
                )}
              </View>
            )}
            {withinWeek > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver datas dos próximos 7 dias"
                style={styles.banner}
                onPress={() =>
                  listRef.current?.scrollToLocation({
                    sectionIndex: 0,
                    itemIndex: 0,
                    viewPosition: 0,
                  })
                }
              >
                <View style={styles.bannerIcon}>
                  <PartyPopper color={theme.colors.primary} size={20} />
                </View>
                <View style={styles.bannerCopy}>
                  <Text style={styles.bannerTitle}>
                    Você tem {withinWeek} {withinWeek === 1 ? 'data' : 'datas'}{' '}
                    nos próximos 7 dias
                  </Text>
                  <Text style={styles.bannerDescription}>
                    Prepare-se para celebrar!
                  </Text>
                </View>
                <ChevronRight color={theme.colors.muted} size={16} />
              </Pressable>
            )}
            {loading && !data && (
              <ActivityIndicator
                accessibilityLabel="Carregando datas"
                color={theme.colors.primary}
              />
            )}
            {(error || (!editor && mutationError)) && (
              <View style={styles.errorCard}>
                <Text accessibilityRole="alert" style={styles.description}>
                  {error || mutationError}
                </Text>
                {error && (
                  <BrandButton
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
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Calendar size={64} color={theme.colors.primary} />
                </View>
                <Text accessibilityRole="header" style={styles.emptyTitle}>
                  Nenhuma data por aqui ainda
                </Text>
                <Text style={styles.emptyDescription}>
                  Adicione aniversários e outras datas importantes para receber
                  lembretes no momento certo.
                </Text>
                <BrandButton
                  label="Adicionar primeira data"
                  icon={<Plus size={16} color="#fff" />}
                  onPress={() => openEditor()}
                  disabled={pending}
                />
              </View>
              <Text accessibilityRole="header" style={styles.tipsTitle}>
                Dicas para aproveitar a Rememberly
              </Text>
              {[
                {
                  title: 'Aniversários',
                  description:
                    'Adicione a data e lembre todos os anos, sem esforço.',
                  Icon: Cake,
                },
                {
                  title: 'Datas especiais',
                  description: 'Adicione casamentos, formaturas e muito mais.',
                  Icon: Star,
                },
                {
                  title: 'Lembretes automáticos',
                  description: 'Receba lembretes no e-mail no momento certo.',
                  Icon: Bell,
                },
              ].map(({ title, description, Icon }) => (
                <View style={styles.tip} key={title}>
                  <View style={styles.bannerIcon}>
                    <Icon color={theme.colors.primary} size={20} />
                  </View>
                  <View style={styles.bannerCopy}>
                    <Text style={styles.tipTitle}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.cardSpacing}>
            <DateCard
              item={item}
              disabled={pending}
              onEdit={
                editableEventId(item) ? () => openEditor(item) : undefined
              }
            />
          </View>
        )}
      />
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
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 32, paddingBottom: 32 },
  header: { marginBottom: 24, gap: 4 },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 14,
    fontFamily: theme.fonts.bold,
  },
  title: {
    color: theme.colors.foreground,
    fontSize: 30,
    lineHeight: 38,
    fontFamily: theme.fonts.headingBold,
  },
  description: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: theme.fonts.heading, fontSize: 14 },
  cardSpacing: { marginBottom: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'hsla(340, 75%, 68%, 0.2)',
    backgroundColor: 'hsla(340, 75%, 68%, 0.05)',
    borderRadius: 24,
    marginBottom: 24,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'hsla(340, 75%, 68%, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCopy: { flex: 1, gap: 2 },
  bannerTitle: { fontFamily: theme.fonts.bold, fontSize: 14, lineHeight: 18 },
  bannerDescription: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  expand: {
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 99,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.card,
  },
  expandText: { fontSize: 14 },
  errorCard: {
    backgroundColor: theme.colors.card,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    marginBottom: 24,
  },
  emptyContainer: { gap: 16 },
  empty: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: theme.colors.mutedBackground,
    alignItems: 'center',
    gap: 20,
  },
  emptyIcon: { height: 144, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  emptyDescription: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  tipsTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    marginTop: 24,
    marginBottom: 8,
  },
  tip: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
  },
  tipTitle: { fontFamily: theme.fonts.heading, fontSize: 16 },
});
