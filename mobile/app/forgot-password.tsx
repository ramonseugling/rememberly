import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DsText, tokens } from '../src/design-system';
import { backToLogin } from '../src/features/auth/navigation';
import { emailError } from '../src/features/auth/api';
import {
  AuthAction,
  AuthField,
  AuthLink,
  AuthPage,
  publicAuth,
  useAuthTask,
} from '../src/features/auth/ui';

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
          <DsText accessible={false} style={styles.emoji}>
            {result === 'sent' ? '📬' : '🔐'}
          </DsText>
          <DsText style={styles.text}>
            {result === 'sent'
              ? 'Pode levar alguns minutos. Verifique também a caixa de spam.'
              : 'Esta conta foi criada usando o Google e não possui senha. Use a opção Entrar com Google na tela de login.'}
          </DsText>
          {result === 'google' && (
            <>
              <AuthAction
                label="Ir para o login com Google"
                disabled={task.pending}
                onPress={() => backToLogin()}
              />
            </>
          )}
          <AuthLink
            label="Voltar para o login"
            disabled={task.pending}
            onPress={() => backToLogin()}
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
            label="Enviar link"
            pending={task.pending}
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
            <DsText style={styles.text}>Lembrou a senha?</DsText>
            <AuthLink
              label="Entrar"
              disabled={task.pending}
              onPress={() => backToLogin()}
            />
          </View>
        </>
      )}
    </AuthPage>
  );
}

const styles = StyleSheet.create({
  feedback: { alignItems: 'stretch', gap: 16 },
  emoji: { fontSize: 48, lineHeight: 64, textAlign: 'center' },
  text: {
    fontSize: 14,
    color: tokens.colors.textMuted,
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
