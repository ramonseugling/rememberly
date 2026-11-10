import { useFocusEffect, router } from 'expo-router';
import { Bell, BellOff } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ApiError,
  useAuthenticatedApi,
  usePullRefresh,
  useResource,
} from '../../src/data/hooks';
import {
  DsBackHeader,
  DsButton,
  DsFeedback,
  DsText,
  DsToggle,
  tokens,
} from '../../src/design-system';
import { nativeNotifications } from '../../src/features/notifications/native';
import {
  pushStatus,
  pushStatusCopy,
} from '../../src/features/notifications/push-status';
import type { PermissionSnapshot } from '../../src/features/notifications/push-status';
import {
  updateNotifications,
  type NotificationPreferences,
  type PushPreferenceField,
} from '../../src/features/notifications/workflow';
import { useSession } from '../../src/session/provider';

const PREFERENCES = '/api/v1/mobile/notification-preferences';

export default function NotificationsScreen() {
  const { state } = useSession();
  return <NotificationsContent key={state.identity?.user.id ?? 'signed-out'} />;
}

function NotificationsContent() {
  const { request } = useAuthenticatedApi();
  const { controller } = useSession();
  const preferences = useResource<NotificationPreferences>(PREFERENCES);
  const pull = usePullRefresh();
  const [permission, setPermission] = useState<PermissionSnapshot | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const focused = useRef(false);
  const unsupported = nativeNotifications.unavailableReason() !== null;

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setError(null);
      if (!nativeNotifications.unavailableReason())
        void nativeNotifications
          .permission()
          .then((snapshot) => {
            if (focused.current) setPermission(snapshot);
          })
          .catch(() => {});
      return () => {
        focused.current = false;
      };
    }, []),
  );

  async function run(action: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await action();
      await preferences.reload();
      if (!nativeNotifications.unavailableReason())
        setPermission(await nativeNotifications.permission());
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Não foi possível atualizar suas preferências. Confira a conexão e tente novamente.',
      );
    } finally {
      busy.current = false;
      if (focused.current) setPending(false);
    }
  }

  function setPush(
    enabled: boolean,
    field: PushPreferenceField = 'push_enabled',
  ) {
    const identity = controller.getSnapshot().identity;
    void run(async () => {
      const result = await updateNotifications(
        enabled,
        nativeNotifications,
        { request },
        () => focused.current && controller.getSnapshot().identity === identity,
        new AbortController().signal,
        {
          field,
          keepDevice:
            field === 'push_enabled'
              ? (preferences.data?.push_marketing ?? false)
              : (preferences.data?.push_enabled ?? false),
        },
      );
      if (result.kind === 'denied')
        setError(
          'Permita as notificações nas configurações do aparelho e tente novamente.',
        );
      else if (result.kind === 'unsupported')
        setError('O push não está disponível neste ambiente.');
    });
  }

  function setEmail(field: 'email_events' | 'email_marketing', value: boolean) {
    void run(async () => {
      await request(PREFERENCES, { method: 'PATCH', body: { [field]: value } });
    });
  }

  const data = preferences.data;
  const status = pushStatus({
    pushEnabled: data?.push_enabled ?? false,
    permission,
    unsupported,
  });
  const copy = pushStatusCopy(status);
  const marketingStatus = pushStatus({
    pushEnabled: data?.push_marketing ?? false,
    permission,
    unsupported,
  });
  const canTogglePushMarketing =
    !!data &&
    !pending &&
    (marketingStatus === 'on' || marketingStatus === 'off');
  const canTogglePush =
    !!data && !pending && (status === 'on' || status === 'off');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pull.refreshing}
            tintColor={tokens.colors.brand}
            colors={[tokens.colors.brand]}
            onRefresh={() => {
              if (!busy.current) pull.run(preferences.reload);
            }}
          />
        }
      >
        <DsBackHeader
          label="Perfil"
          onPress={() => router.navigate('/(tabs)/profile')}
        />
        <View style={styles.header}>
          <DsText role="title">Notificações</DsText>
          <DsText role="caption" style={styles.muted}>
            Escolha como você quer ser lembrado dos eventos importantes.
          </DsText>
        </View>
        {preferences.loading && !data && (
          <ActivityIndicator
            accessibilityLabel="Carregando preferências"
            color={tokens.colors.brand}
          />
        )}
        {preferences.error && (
          <View style={styles.stack}>
            <DsFeedback tone="error" message={preferences.error} />
            <DsButton
              label="Tentar novamente"
              variant="outline"
              onPress={() => {
                void preferences.reload();
              }}
            />
          </View>
        )}
        {data && (
          <>
            <View style={styles.status}>
              <View
                style={[
                  styles.statusIcon,
                  status !== 'on' && styles.statusIconOff,
                ]}
              >
                {status === 'on' ? (
                  <Bell size={22} color={tokens.colors.brand} />
                ) : (
                  <BellOff size={22} color={tokens.colors.textMuted} />
                )}
              </View>
              <View style={styles.statusCopy}>
                <DsText role="label">{copy.title}</DsText>
                <DsText role="caption" style={styles.muted}>
                  {copy.description}
                </DsText>
                {status === 'off' && (
                  <DsButton
                    label="Ativar notificações"
                    disabled={pending}
                    onPress={() => setPush(true)}
                  />
                )}
                {(status === 'off' || status === 'denied') && (
                  <DsButton
                    label="Abrir configurações do aparelho"
                    variant="text"
                    onPress={() => {
                      void Linking.openSettings().catch(() =>
                        setError(
                          'Não foi possível abrir as configurações. Abra-as manualmente no aparelho.',
                        ),
                      );
                    }}
                  />
                )}
              </View>
            </View>
            {error && <DsFeedback tone="error" message={error} />}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <DsText role="section" style={styles.cardTitle}>
                  Tipos de aviso
                </DsText>
                <DsText role="caption" style={styles.column}>
                  Push
                </DsText>
                <DsText role="caption" style={styles.column}>
                  E-mail
                </DsText>
              </View>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <DsText role="label">Eventos</DsText>
                  <DsText role="caption" style={styles.muted}>
                    Aniversários, Dia das Mães, Dia dos Pais e mais, no dia e
                    com a antecedência de cada evento
                  </DsText>
                </View>
                <DsToggle
                  accessibilityLabel="Push de eventos"
                  value={status === 'on'}
                  disabled={!canTogglePush}
                  onValueChange={(value) => setPush(value)}
                />
                <DsToggle
                  accessibilityLabel="E-mail de eventos"
                  value={data.email_events}
                  disabled={pending}
                  onValueChange={(value) => setEmail('email_events', value)}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <DsText role="label">Novidades e dicas</DsText>
                  <DsText role="caption" style={styles.muted}>
                    Novidades do Rememberly
                  </DsText>
                </View>
                <DsToggle
                  accessibilityLabel="Push de novidades e dicas"
                  value={marketingStatus === 'on'}
                  disabled={!canTogglePushMarketing}
                  onValueChange={(value) => setPush(value, 'push_marketing')}
                />
                <DsToggle
                  accessibilityLabel="E-mail de novidades e dicas"
                  value={data.email_marketing}
                  disabled={pending}
                  onValueChange={(value) => setEmail('email_marketing', value)}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: tokens.tabBarClearance,
    gap: 16,
  },
  header: { gap: 6 },
  muted: { color: tokens.colors.textMuted },
  stack: { gap: 12 },
  status: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.iconSurface,
  },
  statusIconOff: { backgroundColor: tokens.colors.surfaceMuted },
  statusCopy: { flex: 1, minWidth: 0, gap: 6 },
  card: {
    padding: 16,
    gap: 4,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 18, lineHeight: 24 },
  column: { width: 56, textAlign: 'center', color: tokens.colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowCopy: { flex: 1, minWidth: 0, gap: 2, paddingRight: 8 },
  divider: { height: 1, backgroundColor: tokens.colors.border },
});
