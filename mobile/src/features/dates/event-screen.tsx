import { createElement, useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Bell, Calendar } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsAvatar,
  DsBackHeader,
  DsButton,
  DsCard,
  DsFeedback,
  DsText,
} from '../../design-system';
import { tokens } from '../../design-system/tokens';
import { ApiError, useAuthenticatedApi, useResource } from '../../data/hooks';
import { useNotificationPrompt } from '../notifications';
import { EventEditor } from './event-editor';
import { eventIcon } from './event-icon';
import { editableEventId, eventTypeLabel, monthNames } from './model';
import type { Agenda, EventPayload } from './model';

type Mode = 'view' | 'edit' | 'new';

function reminderLabel(days: number | null) {
  if (!days) return 'No dia do evento';
  return days === 1 ? '1 dia antes' : `${days} dias antes`;
}

function backToEvents() {
  router.navigate('/(tabs)/events');
}

export function EventScreen() {
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const mode: Mode =
    params.mode === 'new' ? 'new' : params.mode === 'edit' ? 'edit' : 'view';
  const id = typeof params.id === 'string' ? params.id : null;
  const { data, loading, error, reload } = useResource<Agenda>(
    '/api/v1/mobile/agenda',
  );
  const { request } = useAuthenticatedApi();
  const { maybePrompt, element: promptElement } = useNotificationPrompt();
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

  const item = id ? data?.items.find((entry) => entry.id === id) : undefined;
  const eventId = item ? editableEventId(item) : null;
  const missing = mode !== 'new' && !!data && !item;

  async function mutate(
    action: () => Promise<void>,
    failure: string,
    after?: () => void,
  ) {
    if (busy.current || !mounted.current) return;
    busy.current = true;
    setPending(true);
    setMutationError(null);
    try {
      await action();
      if (!mounted.current) return;
      await reload();
      backToEvents();
      after?.();
    } catch (cause) {
      if (
        mounted.current &&
        (!(cause instanceof ApiError) ||
          !['stale', 'cancelled'].includes(cause.kind))
      ) {
        setMutationError(cause instanceof ApiError ? cause.message : failure);
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  function save(payload: EventPayload) {
    const creating = mode === 'new';
    const firstEvent =
      creating &&
      !data?.items.some((entry) => entry.source.kind === 'personal_event');
    if (!creating && !eventId) return;
    void mutate(
      async () => {
        await request(
          creating
            ? '/api/v1/events'
            : `/api/v1/events/${encodeURIComponent(eventId!)}`,
          { method: creating ? 'POST' : 'PATCH', body: payload },
        );
      },
      'Não foi possível salvar este evento. Tente novamente.',
      () => {
        if (firstEvent) void maybePrompt();
      },
    );
  }

  function remove() {
    if (!eventId) return;
    void mutate(async () => {
      await request(`/api/v1/events/${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
      });
    }, 'Não foi possível excluir este evento. Tente novamente.');
  }

  const title =
    mode === 'new'
      ? 'Adicionar evento'
      : mode === 'edit'
        ? 'Editar evento'
        : (item?.title ?? 'Evento');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <DsBackHeader
            label={mode === 'edit' ? 'Evento' : 'Eventos'}
            onPress={() => {
              if (busy.current) return;
              if (mode === 'edit' && item) router.setParams({ mode: 'view' });
              else backToEvents();
            }}
          />
          {mode !== 'view' && (
            <DsText role="title" accessibilityRole="header">
              {title}
            </DsText>
          )}
          {mode !== 'new' && loading && !data && (
            <ActivityIndicator
              accessibilityLabel="Carregando evento"
              color={tokens.colors.primary}
            />
          )}
          {mode !== 'new' && error && (
            <DsCard>
              <DsFeedback message={error} tone="error" />
              <DsButton
                label="Tentar novamente"
                variant="outline"
                onPress={() => {
                  void reload();
                }}
              />
            </DsCard>
          )}
          {missing && (
            <DsCard>
              <DsFeedback
                message="Este evento não está mais disponível."
                tone="error"
              />
              <DsButton
                label="Voltar para eventos"
                variant="outline"
                onPress={backToEvents}
              />
            </DsCard>
          )}
          {mode === 'view' && item && (
            <DsCard>
              <View style={styles.hero}>
                <DsAvatar
                  name={item.title}
                  size={96}
                  fallback={createElement(eventIcon(item.type), {
                    size: 44,
                    color: tokens.colors.onPrimary,
                  })}
                />
                <DsText role="section" style={styles.heroTitle}>
                  {item.title}
                </DsText>
              </View>
              <View style={styles.infoRow}>
                {createElement(eventIcon(item.type), {
                  size: 18,
                  color: tokens.colors.brand,
                })}
                <DsText role="label">{eventTypeLabel(item)}</DsText>
              </View>
              <View style={styles.infoRow}>
                <Calendar size={18} color={tokens.colors.textMuted} />
                <DsText role="label">
                  {item.event_day} de {monthNames[item.event_month - 1]}
                </DsText>
              </View>
              <View style={styles.infoRow}>
                <Bell size={18} color={tokens.colors.textMuted} />
                <DsText role="label">
                  {reminderLabel(item.reminder_days_before)}
                </DsText>
              </View>
              {eventId && (
                <DsButton
                  label="Editar evento"
                  style={styles.action}
                  onPress={() => router.setParams({ mode: 'edit' })}
                />
              )}
            </DsCard>
          )}
          {mode === 'new' && (
            <DsCard>
              <EventEditor
                pending={pending}
                error={mutationError}
                onSave={save}
              />
            </DsCard>
          )}
          {mode === 'edit' && item && eventId && (
            <DsCard>
              <EventEditor
                item={item}
                pending={pending}
                error={mutationError}
                onSave={save}
                onDelete={remove}
              />
            </DsCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {promptElement}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: tokens.tabBarClearance,
    gap: 16,
  },
  hero: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  heroTitle: { textAlign: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  action: { minHeight: 52, marginTop: 8 },
});
