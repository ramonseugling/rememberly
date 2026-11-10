import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useSession } from '../src/session/provider';
import { emailError } from '../src/features/auth/api';
import {
  AuthAction,
  AuthField,
  AuthLink,
  AuthPage,
} from '../src/features/auth/ui';

export default function LoginEmailScreen() {
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
      title="Entrar com e-mail"
      subtitle="Use o e-mail e a senha da sua conta."
      back={
        <AuthLink
          label="← Voltar"
          align="left"
          disabled={busy}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/login');
          }}
        />
      }
      pending={busy}
      message={validation ?? state.message}
    >
      {state.status === 'unavailable' ? (
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
          <AuthField
            label="E-mail"
            icon="email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setValidation(null);
            }}
            editable={!busy}
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
            editable={!busy}
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
            pending={busy}
            disabled={!busy && (!email.trim() || !password)}
          />
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
