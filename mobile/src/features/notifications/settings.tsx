import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError, useAuthenticatedApi, useResource } from '../../data/hooks';
import { useSession } from '../../session/provider';
import { theme } from '../../theme';
import { nativeNotifications } from './native';
import {
  updateNotifications,
  type NotificationPreferences,
  type NotificationResult,
} from './workflow';

export function NotificationSettings() {
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
              ? cause.message
              : 'Unable to complete push registration. Check your connection and retry. Native push credentials must be configured in the installed build.',
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
        Push reminders
      </Text>
      <Text style={styles.text}>
        {preferences.loading
          ? 'Loading notification preferences…'
          : preferences.data
            ? `Account preference: ${preferences.data.push_enabled ? 'enabled' : 'disabled'}. Daily reminders: ${preferences.data.daily_time} (${preferences.data.time_zone}).`
            : 'Notification preferences are unavailable.'}
      </Text>
      <Text style={styles.text}>
        Enabling registers this device. Delivery also requires the server
        notification service to be enabled and configured; saving a preference
        does not confirm delivery. Turning off disables push for your account on
        all devices.
      </Text>
      {unsupported ? <Text style={styles.text}>{unsupported}</Text> : null}
      {preferences.error ? (
        <>
          <Text accessibilityRole="alert" style={styles.text}>
            {preferences.error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void preferences.reload()}
          >
            <Text style={styles.link}>Retry loading preferences</Text>
          </Pressable>
        </>
      ) : null}
      {result?.message ? (
        <Text accessibilityLiveRegion="polite" style={styles.text}>
          {result.message}
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
          {pending ? 'Updating…' : 'Enable / retry on this device'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={pending || !preferences.data}
        accessibilityState={{ disabled: pending || !preferences.data }}
        style={styles.button}
        onPress={() => void change(false)}
      >
        <Text style={styles.link}>Turn off push / retry cleanup</Text>
      </Pressable>
      {result?.kind === 'denied' ? (
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={() =>
            void Linking.openSettings().catch(() =>
              setError(
                'Unable to open Settings. Open device Settings manually.',
              ),
            )
          }
        >
          <Text style={styles.link}>Open device Settings</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
  },
  title: { color: theme.colors.foreground, fontSize: 20, fontWeight: '600' },
  text: { color: theme.colors.foreground, lineHeight: 22 },
  button: { paddingVertical: 12, minHeight: 48 },
  link: { color: theme.colors.foreground, fontWeight: '600' },
});
