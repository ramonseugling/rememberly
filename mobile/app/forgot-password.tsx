import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../src/components/brand-text/brand-text';
import { emailError } from '../src/features/auth/api';
import { googleNeedsBuild } from '../src/features/auth/google-native';
import {
  AuthAction,
  AuthField,
  AuthLink,
  AuthPage,
  publicAuth,
  useAuthTask,
} from '../src/features/auth/ui';
import { theme } from '../src/theme';

export default function ForgotPasswordScreen() {
  const task = useAuthTask();
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<'sent' | 'google' | null>(null);
  const title =
    result === 'sent'
      ? 'Verifique seu e-mail'
      : result === 'google'
        ? 'Conta criada com Google'
        : 'Esqueceu a senha?';
  const subtitle =
    result === 'sent'
      ? 'Se este e-mail estiver cadastrado, você receberá um link em instantes.'
      : result === 'google'
        ? 'Esta conta não usa senha. Entre direto pelo Google.'
        : 'Informe seu e-mail e enviaremos um link para você criar uma nova senha.';

  return (
    <AuthPage
      title={title}
      subtitle={subtitle}
      pending={task.pending}
      message={task.message}
    >
      {result ? (
        <View style={styles.feedback}>
          <Text accessible={false} style={styles.emoji}>
            {result === 'sent' ? '📬' : '🔐'}
          </Text>
          <Text style={styles.text}>
            {result === 'sent'
              ? 'Pode levar alguns minutos. Verifique também a caixa de spam.'
              : 'Esta conta foi criada usando o Google e não possui senha. Use a opção Continuar com Google na tela de login.'}
          </Text>
          {result === 'google' && (
            <>
              <AuthAction
                label="Ir para o login com Google"
                disabled={task.pending}
                onPress={() => router.replace('/login')}
              />
              {googleNeedsBuild && (
                <Text style={styles.text}>
                  No Expo Go, o login com Google requer uma versão de
                  desenvolvimento instalada.
                </Text>
              )}
            </>
          )}
          <AuthLink
            label="Voltar para o login"
            disabled={task.pending}
            onPress={() => router.replace('/login')}
          />
          {result === 'sent' && (
            <AuthLink
              label="Já tenho o código do link"
              disabled={task.pending}
              onPress={() => router.push('/reset-password')}
            />
          )}
        </View>
      ) : (
        <>
          <AuthField
            label="E-mail"
            icon="email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              task.setMessage(null);
            }}
            editable={!task.pending}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <AuthAction
            label={task.pending ? 'Enviando...' : 'Enviar link'}
            disabled={task.pending}
            onPress={() => {
              const error = emailError(email);
              if (error) {
                task.setMessage(error);
                return;
              }
              void task.run(async (signal) => {
                const response = await publicAuth.forgotPassword(email, signal);
                if (signal.aborted) return;
                setResult(response.googleOnly ? 'google' : 'sent');
              });
            }}
          />
          <View style={styles.footer}>
            <Text style={styles.text}>Lembrou a senha?</Text>
            <AuthLink
              label="Entrar"
              disabled={task.pending}
              onPress={() => router.replace('/login')}
            />
          </View>
        </>
      )}
    </AuthPage>
  );
}

const styles = StyleSheet.create({
  feedback: { alignItems: 'stretch', gap: 16 },
  emoji: { fontSize: 48, textAlign: 'center' },
  text: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 4,
    marginTop: 8,
  },
});
