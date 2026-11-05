import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError, useAuthenticatedApi } from '../../data/hooks';
import { theme } from '../../theme';

export function SessionCleanup() {
  const { request } = useAuthenticatedApi();
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const passwordRef = useRef('');
  const focused = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);

  const clearPassword = useCallback(() => {
    passwordRef.current = '';
    setPassword('');
  }, []);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        clearPassword();
        activeRequest.current?.abort();
        activeRequest.current = null;
        setPending(false);
      };
    }, [clearPassword]),
  );

  async function revokeOthers() {
    if (!focused.current || activeRequest.current || !passwordRef.current)
      return;
    const confirmation = passwordRef.current;
    clearPassword();
    const abort = new AbortController();
    activeRequest.current = abort;
    setPending(true);
    setMessage(null);
    try {
      await request('/api/v1/mobile/sessions/others', {
        method: 'DELETE',
        body: { password: confirmation },
        signal: abort.signal,
      });
      if (focused.current && !abort.signal.aborted) {
        setMessage(
          'Other sessions have been signed out. Your current session remains signed in.',
        );
      }
    } catch (cause) {
      if (focused.current && !abort.signal.aborted) {
        setMessage(
          cause instanceof ApiError && cause.status === 403
            ? 'Unable to confirm your password. Enter your current password and try again. Accounts without a password cannot use this action.'
            : cause instanceof ApiError
              ? cause.message
              : 'Unable to sign out other sessions. Please try again.',
        );
      }
    } finally {
      if (activeRequest.current === abort) {
        activeRequest.current = null;
        setPending(false);
      }
    }
  }

  function confirm() {
    if (!focused.current || activeRequest.current || !passwordRef.current)
      return;
    Alert.alert(
      'Sign out other sessions?',
      'All your other active Rememberly sessions will be signed out. Your current session will remain signed in.',
      [
        { text: 'Cancel', style: 'cancel', onPress: clearPassword },
        {
          text: 'Sign out other sessions',
          style: 'destructive',
          onPress: () => void revokeOthers(),
        },
      ],
      { cancelable: true, onDismiss: clearPassword },
    );
  }

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.label}>
        Session security
      </Text>
      <Text style={styles.text}>
        Lost access to another phone or computer? Sign out all your other active
        Rememberly sessions.
      </Text>
      <Text style={styles.hint}>
        Confirm your current password each time. This action requires an account
        with a password.
      </Text>
      <TextInput
        accessibilityLabel="Current password for signing out other sessions"
        value={password}
        onChangeText={(value) => {
          passwordRef.current = value;
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
        returnKeyType="done"
        onSubmitEditing={confirm}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: pending || !password, busy: pending }}
        disabled={pending || !password}
        onPress={confirm}
        style={[styles.button, (pending || !password) && styles.disabled]}
      >
        <Text style={styles.buttonText}>
          {pending ? 'Signing out other sessions…' : 'Sign out other sessions'}
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
    backgroundColor: theme.colors.foreground,
    padding: 16,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
