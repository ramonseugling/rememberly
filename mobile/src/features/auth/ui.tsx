import { Text } from '../../components/brand-text/brand-text';
import { fetch as expoFetch } from 'expo/fetch';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { apiConfiguration } from '../../config/environment';
import { theme } from '../../theme';
import { createPublicAuthApi } from './api';
import { googleNeedsBuild } from './google-native';

export const publicAuth = createPublicAuthApi(
  apiConfiguration.apiOrigin,
  expoFetch,
  apiConfiguration.environment === 'development',
);

export function useAuthTask() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const focused = useRef(false);
  const cancel = useCallback(() => {
    active.current?.abort();
    active.current = null;
    setPending(false);
  }, []);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        cancel();
      };
    }, [cancel]),
  );
  async function run(action: (signal: AbortSignal) => Promise<string | void>) {
    if (active.current || !focused.current) return;
    const abort = new AbortController();
    active.current = abort;
    setPending(true);
    setMessage(null);
    const current = () =>
      focused.current && active.current === abort && !abort.signal.aborted;
    try {
      const result = await action(abort.signal);
      if (current() && result) setMessage(result);
    } catch (error) {
      if (current())
        setMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível concluir a solicitação. Tente novamente.',
        );
    } finally {
      if (active.current === abort) {
        active.current = null;
        if (focused.current) setPending(false);
      }
    }
  }
  return { pending, message, setMessage, run, cancel };
}

interface AuthPageProps {
  title: string;
  subtitle?: string;
  pending: boolean;
  message: string | null;
}
export function AuthPage({
  title,
  subtitle,
  pending,
  message,
  children,
}: PropsWithChildren<AuthPageProps>) {
  return (
    <LinearGradient
      colors={['hsl(340, 60%, 98%)', 'hsl(25, 80%, 98%)']}
      style={styles.safe}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <View style={styles.card}>
              <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              {message && (
                <View style={styles.feedback}>
                  <Text accessibilityRole="alert" style={styles.error}>
                    {message}
                  </Text>
                </View>
              )}
              {pending && (
                <ActivityIndicator
                  accessibilityLabel="Solicitação em andamento"
                  color={theme.colors.primary}
                />
              )}
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

interface AuthFieldProps extends TextInputProps {
  label: string;
  icon?: 'email' | 'name' | 'password';
}
export function AuthField({
  label,
  icon,
  style,
  secureTextEntry,
  editable = true,
  ...props
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const password = icon === 'password' || !!secureTextEntry;
  const Icon = password
    ? Lock
    : icon === 'email'
      ? Mail
      : icon === 'name'
        ? User
        : null;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.focused,
          !editable && { opacity: 0.6 },
        ]}
      >
        {Icon && <Icon size={16} color={theme.colors.muted} />}
        <TextInput
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholder={props.placeholder ?? (password ? '••••••••' : undefined)}
          placeholderTextColor={theme.colors.muted}
          autoCorrect={false}
          editable={editable}
          secureTextEntry={password && !visible}
          style={[styles.input, style]}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
            disabled={!editable}
            onPress={() => setVisible((value) => !value)}
            style={styles.eye}
          >
            {visible ? (
              <EyeOff size={16} color={theme.colors.muted} />
            ) : (
              <Eye size={16} color={theme.colors.muted} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface AuthActionProps {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}
export function AuthAction({ label, disabled, onPress }: AuthActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        (disabled || pressed) && { opacity: disabled ? 0.4 : 0.8 },
      ]}
    >
      <LinearGradient
        colors={['hsl(340, 80%, 65%)', 'hsl(25, 90%, 65%)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.actionContent}
      >
        <Text style={styles.actionText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}
export function AuthLink({
  label,
  onPress,
  disabled,
  align = 'center',
}: AuthActionProps & { align?: 'left' | 'center' | 'right' }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.link,
        {
          alignSelf:
            align === 'left'
              ? 'flex-start'
              : align === 'right'
                ? 'flex-end'
                : 'center',
        },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}
export function AuthGoogleButton({
  disabled,
  onPress,
}: Omit<AuthActionProps, 'label'>) {
  const inactive = !!disabled || googleNeedsBuild;
  return (
    <View style={styles.googleSection}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continuar com Google"
        accessibilityState={{ disabled: inactive }}
        disabled={inactive}
        onPress={onPress}
        style={[styles.googleButton, inactive && { opacity: 0.5 }]}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" accessible={false}>
          <Path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <Path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <Path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <Path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </Svg>
        <Text style={styles.googleText}>Continuar com Google</Text>
      </Pressable>
      {googleNeedsBuild && (
        <Text style={styles.hint}>
          O login com Google não está disponível no Expo Go. Use uma versão de
          desenvolvimento instalada.
        </Text>
      )}
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>OU</Text>
        <View style={styles.line} />
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 448,
    padding: 24,
    gap: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    boxShadow: '0 4px 20px hsla(340, 75%, 68%, 0.08)',
  },
  header: { gap: 8, marginBottom: 0 },
  title: {
    color: theme.colors.foreground,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: theme.fonts.headingBold,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  text: { color: theme.colors.muted, fontSize: 14, lineHeight: 21 },
  hint: { color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  label: { color: theme.colors.foreground, fontSize: 14 },
  field: { gap: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    minHeight: 50,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
  },
  focused: { borderColor: theme.colors.primary },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: 12,
    color: theme.colors.foreground,
    fontSize: 16,
    fontFamily: theme.fonts.body,
  },
  eye: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -12,
  },
  feedback: {
    backgroundColor: 'hsla(0, 84%, 60%, 0.06)',
    borderRadius: 16,
    padding: 12,
  },
  error: { color: theme.colors.destructive, fontSize: 14, lineHeight: 20 },
  action: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 6px 20px hsla(340, 75%, 68%, 0.12)',
  },
  actionContent: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: '#fff',
    textAlign: 'center',
  },
  link: { minHeight: 44, justifyContent: 'center', maxWidth: '100%' },
  linkText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  googleSection: { gap: 12 },
  googleButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: { color: theme.colors.foreground, fontSize: 14, flexShrink: 1 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  line: { height: 1, backgroundColor: theme.colors.border, flex: 1 },
  dividerText: { color: theme.colors.muted, fontSize: 12 },
});
