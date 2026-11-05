import { Text } from '../../components/brand-text/brand-text';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ApiError, useAuthenticatedApi } from '../../data/hooks';
import { useSession } from '../../session/provider';
import { theme } from '../../theme';
import {
  canDeleteAccount,
  createDeletionConfirmation,
} from './deletion-confirmation';

export function DeleteAccount() {
  const { controller, state } = useSession();
  const { request } = useAuthenticatedApi();
  const scope = state.status === 'authenticated' ? state.identity : null;
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputs = useRef({ password: '', confirmation: '' });
  const focused = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  const gate = useRef(createDeletionConfirmation<typeof scope>());

  const clearInputs = useCallback(() => {
    inputs.current = { password: '', confirmation: '' };
    setPassword('');
    setConfirmation('');
  }, []);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setMessage(null);
      return () => {
        focused.current = false;
        gate.current.invalidate();
        activeRequest.current?.abort();
        activeRequest.current = null;
        clearInputs();
        setPending(false);
      };
    }, [scope, clearInputs]),
  );

  function currentScope() {
    const snapshot = controller.getSnapshot();
    return snapshot.status === 'authenticated' ? snapshot.identity : null;
  }

  async function removeAccount(ticket: object) {
    if (
      !focused.current ||
      !scope ||
      !gate.current.submit(ticket, currentScope())
    )
      return;
    if (
      !canDeleteAccount(inputs.current.password, inputs.current.confirmation)
    ) {
      gate.current.invalidate();
      clearInputs();
      setPending(false);
      return;
    }
    const body = { password: inputs.current.password, confirmation: 'DELETE' };
    clearInputs();
    const abort = new AbortController();
    activeRequest.current = abort;
    try {
      await request('/api/v1/mobile/me', {
        method: 'DELETE',
        body,
        signal: abort.signal,
      });
      if (
        focused.current &&
        !abort.signal.aborted &&
        gate.current.current(ticket, currentScope())
      ) {
        await controller.logout();
      }
    } catch (cause) {
      if (
        focused.current &&
        !abort.signal.aborted &&
        gate.current.current(ticket, currentScope())
      ) {
        setMessage(
          cause instanceof ApiError && cause.status === 403
            ? 'Unable to confirm your current password. Enter it again and try again. This action requires an account with a password.'
            : cause instanceof ApiError && cause.status === 409
              ? 'You own one or more groups. Open Groups and delete each group you own before deleting your account. Your account has not been deleted.'
              : cause instanceof ApiError
                ? cause.message
                : 'Unable to delete your account. Please try again.',
        );
      }
    } finally {
      // An older request must not release a newer account's pending operation.
      if (activeRequest.current === abort) {
        activeRequest.current = null;
        gate.current.invalidate();
        setPending(false);
      }
    }
  }

  function confirm() {
    if (
      !focused.current ||
      !scope ||
      currentScope() !== scope ||
      !canDeleteAccount(inputs.current.password, inputs.current.confirmation)
    )
      return;
    const ticket = gate.current.open(scope);
    if (!ticket) return;
    setPending(true);
    setMessage(null);
    const cancel = () => {
      if (!gate.current.current(ticket, currentScope())) return;
      if (!gate.current.cancel(ticket)) return;
      clearInputs();
      setPending(false);
    };
    Alert.alert(
      'Permanently delete your account?',
      'Your account, personal data, and group memberships will be permanently deleted. This cannot be undone. Groups you own must be deleted first.',
      [
        { text: 'Cancel', style: 'cancel', onPress: cancel },
        {
          text: 'Delete account permanently',
          style: 'destructive',
          onPress: () => void removeAccount(ticket),
        },
      ],
      { cancelable: true, onDismiss: cancel },
    );
  }

  const disabled = pending || !canDeleteAccount(password, confirmation);
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.label}>
        Delete account
      </Text>
      <Text style={styles.text}>
        Permanently delete your account, personal data, and group memberships.
        This cannot be undone. Delete any groups you own in Groups first.
      </Text>
      <Text style={styles.hint}>
        This action requires your current password. Type DELETE exactly to
        continue.
      </Text>
      <TextInput
        accessibilityLabel="Current password for deleting your account"
        value={password}
        onChangeText={(value) => {
          inputs.current.password = value;
          setPassword(value);
          setMessage(null);
        }}
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!pending}
        placeholder="Current password"
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
      />
      <TextInput
        accessibilityLabel="Type DELETE to confirm account deletion"
        value={confirmation}
        onChangeText={(value) => {
          inputs.current.confirmation = value;
          setConfirmation(value);
          setMessage(null);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!pending}
        placeholder="Type DELETE"
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={confirm}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: pending }}
        disabled={disabled}
        onPress={confirm}
        style={[styles.button, disabled && styles.disabled]}
      >
        <Text style={styles.buttonText}>
          {pending ? 'Confirming account deletion…' : 'Delete account'}
        </Text>
      </Pressable>
      {message && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  label: { fontSize: 21, color: theme.colors.foreground, fontWeight: '600' },
  text: { fontSize: 17, color: theme.colors.muted, lineHeight: 26 },
  hint: { fontSize: 15, color: theme.colors.muted, lineHeight: 23 },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 16,
    minHeight: 48,
    fontSize: 17,
    color: theme.colors.foreground,
  },
  button: {
    backgroundColor: '#a52136',
    padding: 16,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
