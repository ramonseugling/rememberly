import { fetch as expoFetch } from 'expo/fetch';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiConfiguration } from '../../config/environment';
import { theme } from '../../theme';
import { createPublicAuthApi } from './api';

export const publicAuth = createPublicAuthApi(
  apiConfiguration.apiOrigin,
  expoFetch,
  apiConfiguration.environment === 'development',
);

export function useAuthTask() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
    };
  }, []);
  async function run(action: (signal: AbortSignal) => Promise<string | void>) {
    if (active.current || !mounted.current) return;
    const abort = new AbortController();
    active.current = abort;
    setPending(true);
    setMessage(null);
    try {
      const result = await action(abort.signal);
      if (mounted.current && result) setMessage(result);
    } catch (error) {
      if (mounted.current)
        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to complete this request. Please try again.',
        );
    } finally {
      active.current = null;
      if (mounted.current) setPending(false);
    }
  }
  return { pending, message, setMessage, run };
}

export function AuthPage({
  title,
  pending,
  message,
  children,
}: PropsWithChildren<{
  title: string;
  pending: boolean;
  message: string | null;
}>) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text style={styles.brand}>Rememberly</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {message && (
            <Text accessibilityRole="alert" style={styles.text}>
              {message}
            </Text>
          )}
          {pending && (
            <ActivityIndicator
              accessibilityLabel="Request in progress"
              color={theme.colors.primary}
            />
          )}
          {children}
          <AuthAction
            label="Back to sign in"
            disabled={pending}
            onPress={() => router.replace('/login')}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function AuthField({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <>
      <Text style={styles.text}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
        autoCorrect={false}
        {...props}
      />
    </>
  );
}
export function AuthAction({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && { opacity: 0.45 }]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 16, flexGrow: 1 },
  brand: { color: theme.colors.primary, fontSize: 20, fontWeight: '700' },
  title: { color: theme.colors.foreground, fontSize: 32, fontWeight: '700' },
  text: { color: theme.colors.foreground, fontSize: 16, lineHeight: 24 },
  input: {
    color: theme.colors.foreground,
    minHeight: 48,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 17,
  },
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
});
