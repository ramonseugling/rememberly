import { useCallback, useState } from 'react';
import { backToLogin } from '../src/features/auth/navigation';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  DsCheckbox,
  DsOtpInput,
  DsSelect,
  DsText,
  tokens,
} from '../src/design-system';
import {
  AuthAction,
  AuthField,
  AuthLink,
  AuthPage,
  AuthStepDots,
  LegalLinksText,
  publicAuth,
  styles,
  useAuthTask,
} from '../src/features/auth/ui';
import {
  emailError,
  passwordError,
  registrationDetailsError,
} from '../src/features/auth/api';
import {
  profileDaysInMonth,
  profileMonths,
} from '../src/features/account/profile-presentation';
import { useSession } from '../src/session/provider';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1900 + 1 }, (_, index) => ({
  value: String(currentYear - index),
  label: String(currentYear - index),
}));

const STEPS = 5;

const copy = [
  {
    title: 'Qual é o seu nome?',
    subtitle: 'Assim seus amigos e grupos sabem quem é você.',
  },
  {
    title: 'Qual é o seu e-mail?',
    subtitle: 'Vamos enviar um código para confirmar que ele é seu.',
  },
  { title: 'Verifique seu e-mail', subtitle: '' },
  {
    title: 'Crie uma senha',
    subtitle: 'Você vai usá-la para entrar no Rememberly.',
  },
  {
    title: 'Quando é o seu aniversário?',
    subtitle: 'Para os seus amigos lembrarem de você.',
  },
] as const;

export default function SignupScreen() {
  const { state, controller } = useSession();
  const task = useAuthTask();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );
  const [password, setPassword] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [registered, setRegistered] = useState(false);
  const sessionBusy =
    state.status === 'restoring' || state.status === 'signing-in';
  const busy = task.pending || sessionBusy;
  const address = email.trim().toLowerCase();

  useFocusEffect(
    useCallback(
      () => () => {
        setPassword('');
        setCode('');
        setVerificationToken(null);
      },
      [],
    ),
  );

  function go(next: number) {
    task.setMessage(null);
    setStep(next);
  }
  function submitName() {
    const length = name.trim().length;
    if (length < 2 || length > 100) {
      task.setMessage('Use um nome entre 2 e 100 caracteres.');
      return;
    }
    go(2);
  }
  function sendCode() {
    if (busy) return;
    const error = emailError(address);
    if (error) {
      task.setMessage(error);
      return;
    }
    void task.run(async (signal) => {
      await publicAuth.sendCode(address, signal);
      if (signal.aborted) return;
      setCode('');
      setVerificationToken(null);
      setStep(3);
    });
  }
  function resendCode() {
    if (busy) return;
    void task.run(async (signal) => {
      await publicAuth.sendCode(address, signal);
      if (signal.aborted) return;
      setCode('');
      return 'Novo código enviado. Confira sua caixa de entrada e o spam.';
    });
  }
  function verifyCode() {
    if (busy || code.length !== 6) return;
    void task.run(async (signal) => {
      const token = await publicAuth.verifyCode(address, code, signal);
      if (signal.aborted) return;
      setVerificationToken(token);
      setCode('');
      setStep(4);
    });
  }
  function submitPassword() {
    const error = passwordError(password, password);
    if (error) {
      task.setMessage(error);
      return;
    }
    go(5);
  }
  function submit() {
    if (busy || !verificationToken) return;
    const details = {
      name: name.trim(),
      email: address,
      password,
      birth_day: Number(day),
      birth_month: Number(month),
      birth_year: Number(year),
      marketing_consent: marketing,
      accepted_terms: acceptedTerms,
    };
    const error = registrationDetailsError(details, password);
    if (error) {
      task.setMessage(error);
      return;
    }
    void task.run(async (signal) => {
      await publicAuth.register(
        { ...details, verification_token: verificationToken },
        signal,
      );
      if (signal.aborted) return;
      setPassword('');
      setRegistered(true);
      await controller.login(details.email, details.password);
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

  const current = copy[step - 1]!;
  const birthdayFilled = !!day && !!month && !!year;

  return (
    <AuthPage
      title={registered ? 'Sua conta está pronta!' : current.title}
      subtitle={
        registered
          ? undefined
          : step === 3
            ? `Enviamos um código de 6 dígitos para ${address}`
            : current.subtitle
      }
      pending={busy}
      message={task.message ?? state.message}
      back={
        registered ? undefined : (
          <AuthLink
            label={step === 1 ? '← Entrar' : '← Voltar'}
            align="left"
            disabled={busy}
            onPress={() => {
              if (step === 1) backToLogin();
              else if (step === 4) {
                setVerificationToken(null);
                go(2);
              } else go(step - 1);
            }}
          />
        )
      }
      footer={
        registered ? undefined : <AuthStepDots step={step} total={STEPS} />
      }
    >
      {registered ? (
        <>
          <DsText style={styles.text}>
            Você já pode entrar usando seu e-mail e senha.
          </DsText>
          <AuthAction
            label="Entrar"
            disabled={busy}
            onPress={() => backToLogin()}
          />
        </>
      ) : (
        <>
          {step === 1 && (
            <>
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
                returnKeyType="next"
                onSubmitEditing={submitName}
              />
              <AuthAction
                label="Continuar"
                disabled={busy || !name.trim()}
                onPress={submitName}
              />
            </>
          )}
          {step === 2 && (
            <>
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
                returnKeyType="next"
                onSubmitEditing={sendCode}
              />
              <AuthAction
                label="Continuar"
                pending={task.pending}
                disabled={busy || !email.trim()}
                onPress={sendCode}
              />
            </>
          )}
          {step === 3 && (
            <>
              <DsOtpInput value={code} onChange={setCode} disabled={busy} />
              <AuthAction
                label="Verificar"
                pending={task.pending}
                disabled={busy || code.length !== 6}
                onPress={verifyCode}
              />
              <View style={localStyles.resend}>
                <DsText style={styles.text}>Não recebeu o código?</DsText>
                <AuthLink
                  label="Reenviar"
                  disabled={busy}
                  onPress={resendCode}
                />
              </View>
            </>
          )}
          {step === 4 && (
            <>
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
                returnKeyType="next"
                onSubmitEditing={submitPassword}
              />
              <AuthAction
                label="Continuar"
                disabled={busy || !password}
                onPress={submitPassword}
              />
            </>
          )}
          {step === 5 && (
            <>
              <View style={localStyles.field}>
                <DsText role="label">Aniversário</DsText>
                <View style={localStyles.birthday}>
                  <TextInput
                    accessibilityLabel="Dia do aniversário"
                    value={day}
                    onChangeText={changeDay}
                    editable={!busy}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={localStyles.day}
                    placeholder="Dia"
                    placeholderTextColor={tokens.colors.textMuted}
                  />
                  <View style={localStyles.month}>
                    <DsSelect
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
                    <DsSelect
                      label="Ano"
                      value={year}
                      options={years}
                      disabled={busy}
                      onChange={setYear}
                    />
                  </View>
                </View>
              </View>
              <DsCheckbox
                label="Li e concordo com os Termos de Uso e a Política de Privacidade"
                checked={acceptedTerms}
                disabled={busy}
                onChange={setAcceptedTerms}
                content={
                  <LegalLinksText
                    prefix="Li e concordo com os "
                    style={localStyles.consent}
                  />
                }
              />
              <DsCheckbox
                label="Quero receber novidades e dicas por e-mail"
                checked={marketing}
                disabled={busy}
                onChange={setMarketing}
              />
              <AuthAction
                label="Criar minha conta"
                pending={task.pending}
                disabled={busy || !birthdayFilled || !acceptedTerms}
                onPress={submit}
              />
            </>
          )}
        </>
      )}
    </AuthPage>
  );
}

const localStyles = StyleSheet.create({
  field: { gap: 8 },
  consent: { flex: 1, fontSize: 14, lineHeight: 21 },
  birthday: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
  },
  day: {
    flexBasis: 60,
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: tokens.colors.controlBorder,
    borderRadius: tokens.radius.control,
    minHeight: tokens.controlMinHeight,
    paddingHorizontal: 10,
    paddingVertical: 12,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: tokens.fonts.body,
    color: tokens.colors.text,
    backgroundColor: '#FFFFFF',
  },
  month: { flexBasis: 112, flexGrow: 3 },
  year: { flexBasis: 88, flexGrow: 1 },
  resend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 4,
  },
});
