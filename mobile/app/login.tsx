import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '../src/components/brand-text/brand-text';
import { useSession } from '../src/session/provider';
import { authorizeGoogle } from '../src/features/auth/google-native';
import { emailError } from '../src/features/auth/api';
import {
  AuthAction,
  AuthField,
  AuthGoogleButton,
  AuthLink,
  AuthPage,
  styles,
} from '../src/features/auth/ui';

export default function LoginScreen() {
  const { state, controller } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validation, setValidation] = useState<string | null>(null);
  const busy = state.status === 'restoring' || state.status === 'signing-in';
  useFocusEffect(
    useCallback(
      () => () => {
        setPassword('');
        setValidation(null);
      },
      [],
    ),
  );

  function submit() {
    if (controller.getSnapshot().status !== 'signed-out') return;
    const error =
      emailError(email) ?? (!password ? 'Informe sua senha.' : null);
    if (error) {
      setValidation(error);
      return;
    }
    setValidation(null);
    const submittedPassword = password;
    setPassword('');
    void controller.login(email.trim(), submittedPassword);
  }
  return (
    <AuthPage
      title="Bem-vindo de volta"
      subtitle="Entre para continuar lembrando datas importantes."
      pending={busy}
      message={validation ?? state.message}
    >
      {busy ? (
        <Text accessibilityLiveRegion="polite" style={local.centered}>
          {state.status === 'restoring'
            ? 'Verificando sua sessão...'
            : 'Entrando...'}
        </Text>
      ) : state.status === 'unavailable' ? (
        <>
          <AuthAction
            label="Tentar conexão novamente"
            onPress={() => {
              void controller.restore();
            }}
          />
          <AuthLink
            label="Sair da conta"
            onPress={() => {
              void controller.logout();
            }}
          />
        </>
      ) : (
        <>
          <AuthGoogleButton
            disabled={busy}
            onPress={() => {
              if (controller.getSnapshot().status === 'signed-out') {
                setValidation(null);
                void controller.loginWithGoogle(authorizeGoogle);
              }
            }}
          />
          <AuthField
            label="E-mail"
            icon="email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setValidation(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
          />
          <AuthField
            label="Senha"
            icon="password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setValidation(null);
            }}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          <AuthLink
            label="Esqueci minha senha"
            align="right"
            onPress={() => router.push('/forgot-password')}
          />
          <AuthAction
            label="Entrar"
            onPress={submit}
            disabled={!email.trim() || !password}
          />
          <View style={local.footer}>
            <Text style={styles.text}>Ainda não tem conta?</Text>
            <AuthLink
              label="Criar conta"
              onPress={() => router.push('/signup')}
            />
          </View>
          {state.logoutUnconfirmed && (
            <AuthLink
              label="Tentar encerrar sessão novamente"
              onPress={() => {
                void controller.logout();
              }}
            />
          )}
        </>
      )}
    </AuthPage>
  );
}
const local = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { ...styles.text, textAlign: 'center' },
});
