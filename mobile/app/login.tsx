import { Text } from '../src/components/brand-text/brand-text';
import { useState } from 'react';
import { router } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../src/session/provider';
import { theme } from '../src/theme';
import {
  authorizeGoogle,
  googleNeedsBuild,
} from '../src/features/auth/google-native';

export default function LoginScreen() {
  const { state, controller } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const busy = state.status === 'restoring' || state.status === 'signing-in';

  const submit = () => {
    const submittedPassword = password;
    setPassword('');
    void controller.login(email.trim(), submittedPassword);
  };

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
          <Text accessibilityRole="header" style={styles.heading}>
            Welcome back
          </Text>
          <Text style={styles.text}>Keep the dates that matter close.</Text>
          {state.message && (
            <Text accessibilityRole="alert" style={styles.message}>
              {state.message}
            </Text>
          )}
          {busy ? (
            <View accessibilityLiveRegion="polite" style={styles.card}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.text}>
                {state.status === 'restoring'
                  ? 'Checking your saved sign-in…'
                  : 'Signing in…'}
              </Text>
            </View>
          ) : state.status === 'unavailable' ? (
            <View style={styles.card}>
              <Action
                label="Retry connection"
                onPress={() => {
                  void controller.restore();
                }}
              />
              <Action
                label="Sign out instead"
                onPress={() => {
                  void controller.logout();
                }}
                secondary
              />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="username"
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                accessibilityLabel="Password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (email.trim() && password) submit();
                }}
              />
              <Action
                label="Sign in"
                disabled={!email.trim() || !password}
                onPress={submit}
              />
              <Action
                label="Continuar com Google"
                disabled={googleNeedsBuild}
                secondary
                onPress={() => {
                  void controller.loginWithGoogle(authorizeGoogle);
                }}
              />
              {googleNeedsBuild && (
                <Text style={styles.text}>
                  O login com Google requer uma versão de desenvolvimento
                  instalada. Ele não está disponível no Expo Go.
                </Text>
              )}
              <Action
                label="Create an account"
                secondary
                onPress={() => router.push('/signup')}
              />
              <Action
                label="Forgot password?"
                secondary
                onPress={() => router.push('/forgot-password')}
              />
              {state.logoutUnconfirmed && (
                <Action
                  label="Retry sign-out cleanup"
                  onPress={() => {
                    void controller.logout();
                  }}
                  secondary
                />
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Action({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.secondary,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && { color: theme.colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16 },
  brand: { fontSize: 20, color: theme.colors.primary, fontWeight: '700' },
  heading: { fontSize: 32, color: theme.colors.foreground, fontWeight: '700' },
  text: { fontSize: 16, color: theme.colors.muted, lineHeight: 24 },
  message: { fontSize: 16, color: theme.colors.foreground, lineHeight: 24 },
  card: {
    padding: 20,
    gap: 16,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
  },
  label: { fontSize: 16, color: theme.colors.foreground },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 17,
    color: theme.colors.foreground,
  },
  button: {
    minHeight: 48,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondary: { backgroundColor: theme.colors.background },
  buttonText: { fontSize: 17, fontWeight: '600', color: '#ffffff' },
});
