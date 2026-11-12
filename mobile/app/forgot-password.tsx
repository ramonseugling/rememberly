import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DsOtpInput, DsText, tokens } from '../src/design-system';
import { backToLogin } from '../src/features/auth/navigation';
import { useSession } from '../src/session/provider';
import { emailError, passwordError } from '../src/features/auth/api';
import { useResendCooldown } from '../src/features/auth/resend-cooldown';
import {
  AuthAction,
  AuthBack,
  AuthField,
  AuthLink,
  AuthPage,
  AuthStepDots,
  publicAuth,
  styles,
  useAuthTask,
} from '../src/features/auth/ui';

const STEPS = 3;

export default function ForgotPasswordScreen() {
  const { controller } = useSession();
  const task = useAuthTask();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [googleOnly, setGoogleOnly] = useState(false);
  const [done, setDone] = useState(false);
  const resend = useResendCooldown();
  const address = email.trim().toLowerCase();

  function go(next: number) {
    task.setMessage(null);
    setStep(next);
  }
  function sendCode() {
    const error = emailError(address);
    if (error) {
      task.setMessage(error);
      return;
    }
    void task.run(async (signal) => {
      const response = await publicAuth.forgotPassword(address, signal);
      if (signal.aborted) return;
      setCode('');
      setResetToken(null);
      if (response.googleOnly) {
        setGoogleOnly(true);
        return;
      }
      resend.start();
      setStep(2);
    });
  }
  function resendCode() {
    if (resend.cooldown > 0) return;
    void task.run(async (signal) => {
      await publicAuth.forgotPassword(address, signal);
      if (signal.aborted) return;
      setCode('');
      resend.start();
      return 'Novo código enviado. Confira sua caixa de entrada e o spam.';
    });
  }
  function verifyCode() {
    if (code.length !== 6) return;
    void task.run(async (signal) => {
      const token = await publicAuth.verifyResetCode(address, code, signal);
      if (signal.aborted) return;
      setResetToken(token);
      setCode('');
      setStep(3);
    });
  }
  function savePassword() {
    const error = passwordError(password, confirmation);
    if (error || !resetToken) {
      task.setMessage(error ?? 'Confirme o código novamente.');
      return;
    }
    void task.run(async (signal) => {
      await publicAuth.resetPassword(resetToken, password, signal);
      if (signal.aborted) return;
      const newPassword = password;
      setPassword('');
      setConfirmation('');
      setResetToken(null);
      await controller.login(address, newPassword);
      if (signal.aborted) return;
      if (controller.getSnapshot().status !== 'authenticated') setDone(true);
    });
  }

  if (googleOnly) {
    return (
      <AuthPage
        title="Conta criada com Google"
        pending={task.pending}
        message={task.message}
        notice={task.notice}
      >
        <View style={local.feedback}>
          <DsText accessible={false} style={local.emoji}>
            🔐
          </DsText>
          <DsText style={local.text}>
            Esta conta foi criada usando o Google e não possui senha. Use a
            opção Entrar com Google na tela de login.
          </DsText>
          <AuthAction
            label="Ir para o login com Google"
            disabled={task.pending}
            onPress={() => backToLogin()}
          />
        </View>
      </AuthPage>
    );
  }

  if (done) {
    return (
      <AuthPage
        title="Senha redefinida!"
        pending={task.pending}
        message={task.message}
        notice={task.notice}
      >
        <View style={local.feedback}>
          <DsText accessible={false} style={local.emoji}>
            ✅
          </DsText>
          <AuthAction label="Entrar" onPress={() => backToLogin()} />
        </View>
      </AuthPage>
    );
  }

  const title = [
    'Esqueceu a senha?',
    'Verifique seu e-mail',
    'Crie uma nova senha',
  ][step - 1]!;

  return (
    <AuthPage
      title={title}
      pending={task.pending}
      message={task.message}
      notice={task.notice}
      counter={<AuthStepDots step={step} total={STEPS} />}
      back={
        <AuthBack
          label={step === 1 ? 'Entrar' : 'Voltar'}
          disabled={task.pending}
          onPress={() => {
            if (step === 1) backToLogin();
            else if (step === 3) {
              setResetToken(null);
              go(1);
            } else go(step - 1);
          }}
        />
      }
    >
      {step === 1 && (
        <>
          <AuthField
            hideLabel
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
            returnKeyType="send"
            onSubmitEditing={sendCode}
          />
          <AuthAction
            label="Enviar código"
            pending={task.pending}
            disabled={task.pending || !email.trim()}
            onPress={sendCode}
          />
        </>
      )}
      {step === 2 && (
        <>
          <DsOtpInput value={code} onChange={setCode} disabled={task.pending} />
          <AuthAction
            label="Verificar"
            pending={task.pending}
            disabled={task.pending || code.length !== 6}
            onPress={verifyCode}
          />
          <View style={local.resend}>
            <DsText style={styles.text}>Não recebeu o código?</DsText>
            <AuthLink
              label={resend.label}
              disabled={task.pending || resend.cooldown > 0}
              onPress={resendCode}
            />
          </View>
        </>
      )}
      {step === 3 && (
        <>
          <AuthField
            hideLabel
            label="Nova senha"
            icon="password"
            placeholder="Nova senha"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              task.setMessage(null);
            }}
            editable={!task.pending}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={72}
            returnKeyType="next"
          />
          <AuthField
            hideLabel
            label="Confirme a senha"
            icon="password"
            placeholder="Confirme a senha"
            value={confirmation}
            onChangeText={(value) => {
              setConfirmation(value);
              task.setMessage(null);
            }}
            editable={!task.pending}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={72}
            returnKeyType="done"
            onSubmitEditing={savePassword}
          />
          <AuthAction
            label="Salvar nova senha"
            pending={task.pending}
            disabled={task.pending || !password || !confirmation}
            onPress={savePassword}
          />
        </>
      )}
    </AuthPage>
  );
}

const local = StyleSheet.create({
  feedback: { alignItems: 'stretch', gap: 16 },
  emoji: { fontSize: 48, lineHeight: 64, textAlign: 'center' },
  text: {
    fontSize: 14,
    color: tokens.colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  resend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 4,
  },
});
