import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Text } from '../../components/brand-text/brand-text';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { ApiError, useAuthenticatedApi, useResource } from '../../data/hooks';
import { useSession } from '../../session/provider';
import {
  resolveAppearance,
  type ComponentAppearance,
  type ResolvedAppearance,
} from '../../components/component-appearance';
import { nativeNotifications } from './native';
import {
  updateNotifications,
  type NotificationPreferences,
  type NotificationResult,
} from './workflow';

export function NotificationSettings({
  appearance,
}: { appearance?: ComponentAppearance } = {}) {
  const theme = resolveAppearance(appearance);
  const styles = createStyles(theme);
  const { request } = useAuthenticatedApi();
  const { state, controller } = useSession();
  const preferences = useResource<NotificationPreferences>(
    '/api/v1/mobile/notification-preferences',
  );
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<NotificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const focused = useRef(false);
  const operation = useRef<AbortController | null>(null);
  const scope = state.identity;
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setResult(null);
      setError(null);
      setPending(false);
      return () => {
        focused.current = false;
        operation.current?.abort();
        operation.current = null;
      };
    }, [scope]),
  );

  async function change(enabled: boolean) {
    if (!focused.current || operation.current || !scope) return;
    const abort = new AbortController();
    operation.current = abort;
    const active = () =>
      focused.current &&
      controller.getSnapshot().identity === scope &&
      operation.current === abort;
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const next = await updateNotifications(
        enabled,
        nativeNotifications,
        { request },
        active,
        abort.signal,
      );
      if (active() && !abort.signal.aborted && next.kind !== 'stale') {
        setResult(next);
        await preferences.reload();
      }
    } catch (cause) {
      if (active() && !abort.signal.aborted) {
        setError(
          cause instanceof ApiError
            ? cause.message
            : !enabled &&
                cause instanceof Error &&
                cause.message.startsWith('Push is disabled')
              ? 'Os lembretes foram desativados, mas não foi possível concluir a remoção deste dispositivo. Tente desativar novamente.'
              : 'Não foi possível atualizar os lembretes neste dispositivo. Confira sua conexão e tente novamente.',
        );
        await preferences.reload();
      }
    } finally {
      if (active()) {
        operation.current = null;
        setPending(false);
      }
    }
  }

  const unsupported = nativeNotifications.unavailableReason();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Lembretes no dispositivo
      </Text>
      <Text style={styles.text}>
        {preferences.loading
          ? 'Carregando preferências...'
          : preferences.data
            ? `Lembretes ${preferences.data.push_enabled ? 'ativados' : 'desativados'} para sua conta.`
            : 'Não foi possível carregar suas preferências.'}
      </Text>
      <Text style={styles.text}>
        Ative para receber lembretes neste dispositivo. Desativar interrompe os
        lembretes no dispositivo em toda a sua conta.
      </Text>
      {unsupported ? (
        <Text style={styles.text}>
          Os lembretes no dispositivo não estão disponíveis neste ambiente de
          visualização.
        </Text>
      ) : null}
      {preferences.error ? (
        <>
          <Text accessibilityRole="alert" style={styles.text}>
            {preferences.error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void preferences.reload()}
          >
            <Text style={styles.link}>Tentar novamente</Text>
          </Pressable>
        </>
      ) : null}
      {result?.message ? (
        <Text accessibilityLiveRegion="polite" style={styles.text}>
          {result.kind === 'registered'
            ? 'Dispositivo registrado. O recebimento dos lembretes depende da disponibilidade do serviço, das permissões e da conexão.'
            : result.kind === 'disabled'
              ? 'Lembretes desativados para sua conta.'
              : result.kind === 'denied'
                ? 'Permita as notificações nas configurações do dispositivo e tente novamente.'
                : result.kind === 'unsupported'
                  ? 'Os lembretes não estão disponíveis neste ambiente de visualização.'
                  : ''}
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.text}>
          {error}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: pending || !preferences.data || !!unsupported,
        }}
        disabled={pending || !preferences.data || !!unsupported}
        style={styles.button}
        onPress={() => void change(true)}
      >
        <Text style={styles.link}>
          {pending ? 'Atualizando...' : 'Ativar neste dispositivo'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={pending || !preferences.data}
        accessibilityState={{ disabled: pending || !preferences.data }}
        style={styles.button}
        onPress={() => void change(false)}
      >
        <Text style={styles.link}>Desativar lembretes</Text>
      </Pressable>
      {result?.kind === 'denied' ? (
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={() =>
            void Linking.openSettings().catch(() =>
              setError(
                'Não foi possível abrir as configurações. Abra-as manualmente no dispositivo.',
              ),
            )
          }
        >
          <Text style={styles.link}>Abrir configurações do dispositivo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (theme: ResolvedAppearance) =>
  StyleSheet.create({
    section: {
      gap: 12,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    title: {
      color: theme.colors.foreground,
      fontSize: 16,
      fontFamily: theme.fonts.heading,
    },
    text: { color: theme.colors.muted, fontSize: 14, lineHeight: 21 },
    button: { paddingVertical: 12, minHeight: 48 },
    link: { color: theme.colors.foreground, fontFamily: theme.fonts.bold },
  });
