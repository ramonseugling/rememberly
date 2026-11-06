import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../src/components/brand-text/brand-text';
import { OtpInput } from '../src/components/otp-input/otp-input';
import { SelectField } from '../src/components/select-field/select-field';
import {
  AuthAction,
  AuthField,
  AuthGoogleButton,
  AuthLink,
  AuthPage,
  publicAuth,
  styles,
  useAuthTask,
} from '../src/features/auth/ui';
import {
  registrationDetailsError,
  registrationError,
  type Registration,
} from '../src/features/auth/api';
import { authorizeGoogle } from '../src/features/auth/google-native';
import {
  profileDaysInMonth,
  profileMonths,
} from '../src/features/account/profile-presentation';
import { useSession } from '../src/session/provider';
import { theme } from '../src/theme';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1900 + 1 }, (_, index) => ({
  value: String(currentYear - index),
  label: String(currentYear - index),
}));

export default function SignupScreen() {
  const { state, controller } = useSession();
  const task = useAuthTask();
  const [email, setEmail] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [registered, setRegistered] = useState(false);
  const sessionBusy =
    state.status === 'restoring' || state.status === 'signing-in';
  const busy = task.pending || sessionBusy;

  useFocusEffect(
    useCallback(
      () => () => {
        setPassword('');
        setCode('');
        setVerifiedEmail(null);
      },
      [],
    ),
  );

  function details(address: string): Omit<Registration, 'otp_code'> {
    return {
      name: name.trim(),
      email: address,
      password,
      birth_day: Number(day),
      birth_month: Number(month),
      birth_year: Number(year),
      marketing_consent: marketing,
    };
  }
  function sendCode() {
    if (busy) return;
    const address = email.trim().toLowerCase();
    const error = registrationDetailsError(details(address), password);
    if (error) {
      task.setMessage(error);
      return;
    }
    void task.run(async (signal) => {
      await publicAuth.sendCode(address, signal);
      if (signal.aborted) return;
      setVerifiedEmail(address);
      setCode('');
    });
  }
  function resendCode() {
    if (busy || !verifiedEmail) return;
    const address = verifiedEmail;
    void task.run(async (signal) => {
      await publicAuth.sendCode(address, signal);
      if (signal.aborted) return;
      setCode('');
      return 'Novo código enviado. Confira sua caixa de entrada e o spam.';
    });
  }
  function submit() {
    if (busy || !verifiedEmail) return;
    const input = { ...details(verifiedEmail), otp_code: code };
    const error = registrationError(input, password);
    if (error) {
      task.setMessage(error);
      return;
    }
    void task.run(async (signal) => {
      await publicAuth.register(input, signal);
      if (signal.aborted) return;
      setPassword('');
      setCode('');
      setRegistered(true);
      await controller.login(input.email, input.password);
      if (signal.aborted) return;
      return 'Sua conta foi criada. Entre com sua senha se o acesso não tiver sido concluído.';
    });
  }
  function changeDay(value: string) {
    if (
      !/^\d*$/.test(value) ||
      (value !== '' &&
        (Number(value) < 1 || Number(value) > profileDaysInMonth(month)))
    )
      return;
    setDay(value.slice(0, 2));
  }

  return (
    <AuthPage
      title={
        registered
          ? 'Sua conta está pronta!'
          : verifiedEmail
            ? 'Verifique seu e-mail'
            : 'Crie sua conta'
      }
      subtitle={
        registered
          ? undefined
          : verifiedEmail
            ? `Enviamos um código de 6 dígitos para ${verifiedEmail}`
            : 'Leva menos de um minuto.'
      }
      pending={busy}
      message={task.message ?? state.message}
    >
      {registered ? (
        <>
          <Text style={styles.text}>
            Você já pode entrar usando seu e-mail e senha.
          </Text>
          <AuthAction
            label="Entrar"
            disabled={busy}
            onPress={() => router.replace('/login')}
          />
        </>
      ) : !verifiedEmail ? (
        <>
          <AuthGoogleButton
            disabled={busy}
            onPress={() => {
              if (!busy) void controller.loginWithGoogle(authorizeGoogle);
            }}
          />
          <AuthField
            label="Nome"
            icon="name"
            placeholder="Seu nome"
            value={name}
            onChangeText={setName}
            editable={!busy}
            autoComplete="name"
            autoCapitalize="words"
            maxLength={100}
          />
          <AuthField
            label="E-mail"
            icon="email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            editable={!busy}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <AuthField
            label="Senha"
            icon="password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            editable={!busy}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={72}
          />
          <View style={localStyles.field}>
            <Text style={localStyles.label}>Data de nascimento</Text>
            <View style={localStyles.birthday}>
              <TextInput
                accessibilityLabel="Dia de nascimento"
                value={day}
                onChangeText={changeDay}
                editable={!busy}
                keyboardType="number-pad"
                maxLength={2}
                style={localStyles.day}
                placeholder="Dia"
                placeholderTextColor={theme.colors.muted}
              />
              <View style={localStyles.month}>
                <SelectField
                  label="Mês"
                  value={month}
                  options={profileMonths}
                  disabled={busy}
                  onChange={(value) => {
                    setMonth(value);
                    if (Number(day) > profileDaysInMonth(value))
                      setDay(String(profileDaysInMonth(value)));
                  }}
                />
              </View>
              <View style={localStyles.year}>
                <SelectField
                  label="Ano"
                  value={year}
                  options={years}
                  disabled={busy}
                  onChange={setYear}
                />
              </View>
            </View>
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel="Quero receber novidades e dicas por e-mail"
            accessibilityState={{ checked: marketing, disabled: busy }}
            disabled={busy}
            onPress={() => setMarketing((value) => !value)}
            style={localStyles.consent}
          >
            <View
              style={[localStyles.checkbox, marketing && localStyles.checked]}
            >
              {marketing && <Check size={14} color="white" />}
            </View>
            <Text style={localStyles.consentText}>
              Quero receber novidades e dicas por e-mail
            </Text>
          </Pressable>
          <AuthAction
            label={task.pending ? 'Enviando código...' : 'Continuar'}
            disabled={busy}
            onPress={sendCode}
          />
          <View style={localStyles.login}>
            <Text style={styles.text}>Já tem conta?</Text>
            <AuthLink
              label="Entrar"
              onPress={() => router.replace('/login')}
              disabled={busy}
            />
          </View>
        </>
      ) : (
        <>
          <AuthLink
            label="← Voltar"
            align="left"
            disabled={busy}
            onPress={() => {
              setVerifiedEmail(null);
              setCode('');
              task.setMessage(null);
            }}
          />
          <OtpInput value={code} onChange={setCode} disabled={busy} />
          <Text style={localStyles.otpHint}>
            O código expira em 10 minutos. Solicitar outro código substitui o
            anterior.
          </Text>
          <AuthAction
            label={task.pending ? 'Verificando...' : 'Verificar e criar conta'}
            disabled={busy || code.length !== 6}
            onPress={submit}
          />
          <View style={localStyles.resend}>
            <Text style={styles.text}>Não recebeu o código?</Text>
            <AuthLink label="Reenviar" disabled={busy} onPress={resendCode} />
          </View>
        </>
      )}
    </AuthPage>
  );
}

const localStyles = StyleSheet.create({
  field: { gap: 8 },
  label: {
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.colors.foreground,
  },
  birthday: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
  },
  day: {
    flexBasis: 60,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 12,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.background,
  },
  month: { flexBasis: 112, flexGrow: 3 },
  year: { flexBasis: 88, flexGrow: 1 },
  consent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 44,
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    height: 18,
    width: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  consentText: {
    flex: 1,
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  login: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 4,
  },
  resend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 4,
  },
  otpHint: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
