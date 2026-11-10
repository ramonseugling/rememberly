import { fetch as expoFetch } from 'expo/fetch';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { TextInputProps, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { apiConfiguration } from '../../config/environment';
import {
  DsBrandHeader,
  DsButton,
  DsFeedback,
  DsText,
  tokens,
} from '../../design-system';
import * as WebBrowser from 'expo-web-browser';
import { LEGAL_LINKS } from '../legal/links';
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
  compactBrand?: boolean;
  footer?: ReactNode;
  back?: ReactNode;
}
export function AuthPage({
  title,
  subtitle,
  message,
  compactBrand,
  footer,
  back,
  children,
}: PropsWithChildren<AuthPageProps>) {
  return (
    <LinearGradient colors={tokens.backgroundGradient} style={styles.safe}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <DsBrandHeader compact={compactBrand} />
            <View style={styles.card}>
              {back}
              <View style={styles.header}>
                <DsText role="title" style={styles.title}>
                  {title}
                </DsText>
                {subtitle && (
                  <DsText role="caption" style={styles.subtitle}>
                    {subtitle}
                  </DsText>
                )}
              </View>
              {message && <DsFeedback tone="error" message={message} />}
              {children}
            </View>
            {footer}
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
      <DsText role="label">{label}</DsText>
      <View
        style={[
          styles.inputRow,
          focused && styles.focused,
          !editable && { opacity: 0.6 },
        ]}
      >
        {Icon && <Icon size={18} color={tokens.colors.textMuted} />}
        <TextInput
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholder={props.placeholder ?? (password ? '••••••••' : undefined)}
          placeholderTextColor={tokens.colors.textMuted}
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
              <EyeOff size={18} color={tokens.colors.textMuted} />
            ) : (
              <Eye size={18} color={tokens.colors.textMuted} />
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
  pending?: boolean;
  onPress: () => void;
}
export function AuthAction({
  label,
  disabled,
  pending,
  onPress,
}: AuthActionProps) {
  return (
    <DsButton
      label={label}
      disabled={disabled}
      pending={pending}
      onPress={onPress}
      style={styles.action}
    />
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
      <DsText role="label" style={styles.linkText}>
        {label}
      </DsText>
    </Pressable>
  );
}
const openLegal = (url: string) => {
  void WebBrowser.openBrowserAsync(url).catch(() => undefined);
};

export function LegalLinksText({
  prefix,
  style,
}: {
  prefix: string;
  style?: TextStyle;
}) {
  return (
    <DsText role="caption" style={[styles.legalText, style]}>
      {prefix}
      <DsText
        role="caption"
        accessibilityRole="link"
        style={styles.legalLink}
        onPress={() => openLegal(LEGAL_LINKS.terms)}
      >
        Termos de Uso
      </DsText>
      {' e a '}
      <DsText
        role="caption"
        accessibilityRole="link"
        style={styles.legalLink}
        onPress={() => openLegal(LEGAL_LINKS.privacy)}
      >
        Política de Privacidade
      </DsText>
      .
    </DsText>
  );
}

export function AuthStepDots({ step, total }: { step: number; total: number }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Passo ${step} de ${total}`}
      style={styles.dots}
    >
      {Array.from({ length: total }, (_, index) =>
        index + 1 === step ? (
          <LinearGradient
            key={index}
            colors={tokens.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dotActive}
          />
        ) : (
          <View key={index} style={styles.dot} />
        ),
      )}
    </View>
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
        accessibilityLabel="Entrar com Google"
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
        <DsText role="label" style={styles.googleText}>
          Entrar com Google
        </DsText>
      </Pressable>
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
    gap: 24,
  },
  card: {
    width: '100%',
    maxWidth: 448,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16,
    borderRadius: tokens.radius.sheet,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  header: { gap: 6 },
  title: { textAlign: 'center' },
  subtitle: { color: tokens.colors.textMuted, textAlign: 'center' },
  text: { color: tokens.colors.textMuted, fontSize: 14, lineHeight: 21 },
  legalText: { color: tokens.colors.textMuted, fontSize: 12, lineHeight: 18 },
  legalCentered: { textAlign: 'center' },
  legalLink: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  field: { gap: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    minHeight: tokens.controlMinHeight,
    borderColor: tokens.colors.controlBorder,
    borderWidth: 1.5,
    borderRadius: tokens.radius.control,
    backgroundColor: '#FFFFFF',
  },
  focused: { borderColor: tokens.colors.primary },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingVertical: 10,
    color: tokens.colors.text,
    fontSize: 16,
    fontFamily: tokens.fonts.body,
  },
  eye: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -12,
  },
  action: { minHeight: 52 },
  link: { minHeight: 44, justifyContent: 'center', maxWidth: '100%' },
  linkText: {
    color: tokens.colors.actionText,
    textAlign: 'center',
    fontSize: 14,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.border,
  },
  dotActive: { width: 28, height: 8, borderRadius: 4 },
  googleSection: { gap: 12 },
  googleButton: {
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    backgroundColor: '#FFFFFF',
    borderRadius: tokens.radius.button,
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: { flexShrink: 1 },
});
