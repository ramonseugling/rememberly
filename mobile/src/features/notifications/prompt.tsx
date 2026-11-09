import { Bell } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useAuthenticatedApi } from '../../data/hooks';
import {
  DsButton,
  DsEmptyIcon,
  DsFeedback,
  DsText,
  tokens,
} from '../../design-system';
import { useSession } from '../../session/provider';
import { nativeNotifications } from './native';
import { shouldPrompt } from './prompt-rules';
import {
  readPromptDismissedAt,
  writePromptDismissedAt,
} from './prompt-storage';
import { updateNotifications } from './workflow';
import type { NotificationPreferences } from './workflow';

export function useNotificationPrompt() {
  const { request } = useAuthenticatedApi();
  const { state } = useSession();
  const userId = state.identity?.user.id;
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checking = useRef(false);

  const maybePrompt = useCallback(async () => {
    if (!userId || checking.current) return;
    checking.current = true;
    try {
      const preferences = await request<NotificationPreferences>(
        '/api/v1/mobile/notification-preferences',
      );
      const dismissedAt = await readPromptDismissedAt(userId);
      if (
        shouldPrompt({
          pushEnabled: preferences.push_enabled,
          unavailable: nativeNotifications.unavailableReason() !== null,
          dismissedAt,
          now: Date.now(),
        })
      ) {
        setError(null);
        setVisible(true);
      }
    } catch {
      // The prompt is optional; a failed check must never block the flow.
    } finally {
      checking.current = false;
    }
  }, [request, userId]);

  async function dismiss() {
    setVisible(false);
    if (userId) await writePromptDismissedAt(userId, Date.now());
  }

  async function enable() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await updateNotifications(
        true,
        nativeNotifications,
        { request },
        () => true,
        new AbortController().signal,
      );
      if (result.kind === 'registered') {
        setVisible(false);
        return;
      }
      if (result.kind === 'denied') {
        await dismiss();
        return;
      }
      setError(result.message || 'Não foi possível ativar agora.');
    } catch {
      setError(
        'Não foi possível ativar as notificações. Confira sua conexão e tente novamente.',
      );
    } finally {
      setPending(false);
    }
  }

  const element = (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        void dismiss();
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agora não"
          style={StyleSheet.absoluteFill}
          onPress={() => {
            void dismiss();
          }}
        />
        <View accessibilityViewIsModal style={styles.card}>
          <DsEmptyIcon size={72} gradient>
            <Bell size={34} color={tokens.colors.onPrimary} />
          </DsEmptyIcon>
          <View style={styles.copy}>
            <DsText role="section" style={styles.center}>
              Quer ser lembrado?
            </DsText>
            <DsText style={[styles.center, { color: tokens.colors.textMuted }]}>
              Ative as notificações para receber um aviso no dia de cada
              aniversário e evento importante, mesmo com o app fechado.
            </DsText>
          </View>
          {error && <DsFeedback tone="error" message={error} />}
          <DsButton
            label="Ativar notificações"
            pending={pending}
            onPress={() => {
              void enable();
            }}
          />
          <DsButton
            label="Agora não"
            variant="text"
            disabled={pending}
            onPress={() => {
              void dismiss();
            }}
          />
        </View>
      </View>
    </Modal>
  );

  return { maybePrompt, element };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: tokens.colors.overlay,
  },
  card: {
    padding: 20,
    paddingTop: 28,
    gap: 16,
    borderRadius: tokens.radius.sheet,
    backgroundColor: tokens.colors.surface,
  },
  copy: { gap: 8 },
  center: { textAlign: 'center' },
});
