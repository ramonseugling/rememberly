import { useCallback, useState } from 'react';
import { backToLogin } from '../src/features/auth/navigation';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  DsCheckbox,
  DsFeedback,
  DsOtpInput,
  DsSelect,
  DsText,
  tokens,
} from '../src/design-system';
import {
  AuthAction,
  AuthBack,
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
  nameError,
  passwordError,
  registrationDetailsError,
} from '../src/features/auth/api';
import {
  profileDaysInMonth,
  profileMonths,
} from '../src/features/account/profile-presentation';
import { useResendCooldown } from '../src/features/auth/resend-cooldown';
import { useSession } from '../src/session/provider';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1900 + 1 }, (_, index) => ({
  value: String(currentYear - index),
  label: String(currentYear - index),
}));

const STEPS = 5;

const titles = [
  'Qual é o seu e-mail?',
  'Verifique seu e-mail',
  'Qual é o seu nome?',
  'Crie uma senha',
  'Quando é o seu aniversário?',
] as const;

export default function SignupScreen() {
  const { state, controller } = useSession();
  const task = useAuthTask();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const resend = useResendCooldown();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [marketing, setMarketing] = useState(true);
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
        setConfirmation('');
        setCode('');
        setVerificationToken(null);
        setSentTo(null);
      },
      [],
    ),
  );

  function go(next: number) {
    task.setMessage(null);
    setStep(next);
  }
  function submitName() {
    const error =
      nameError(firstName, 'nome') ?? nameError(lastName, 'sobrenome');
    if (error) {
      task.setMessage(error);
      return;
    }
    go(4);
  }
  function sendCode() {
    if (busy) return;
    if (verificationToken || sentTo === address) {
      go(2);
      return;
    }
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
      setSentTo(address);
      resend.start();
      setStep(2);
    });
  }
  function resendCode() {
    if (busy || resend.cooldown > 0) return;
    void task.run(async (signal) => {
      await publicAuth.sendCode(address, signal);
      if (signal.aborted) return;
      setCode('');
      resend.start();
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
      setStep(3);
    });
  }
  function submitPassword() {
    const error = passwordError(password, confirmation);
    if (error) {
      task.setMessage(error);
      return;
    }
    go(5);
  }
  function submit() {
    if (busy || !verificationToken) return;
    const details = {
      name: `${firstName.trim()} ${lastName.trim()}`,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
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
      setConfirmation('');
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

  const current = titles[step - 1]!;
  const birthdayFilled = !!day && !!month && !!year;

  return (
    <AuthPage
      title={registered ? 'Sua conta está pronta!' : current}
      pending={busy}
      message={task.message ?? state.message}
      notice={task.notice}
      back={
        registered ? undefined : (
          <AuthBack
            label={step === 1 ? 'Entrar' : 'Voltar'}
            disabled={busy}
            onPress={() => {
              if (step === 1) backToLogin();
              else go(step - 1);
            }}
          />
        )
      }
      counter={
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
                hideLabel
                label="E-mail"
                icon="email"
                placeholder="seu@email.com"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setVerificationToken(null);
                }}
                editable={!busy}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={sendCode}
              />
              <DsCheckbox
                label="Quero receber novidades e ofertas do Rememberly"
                checked={marketing}
                disabled={busy}
                onChange={setMarketing}
              />
              <AuthAction
                label="Continuar"
                pending={task.pending}
                disabled={busy || !email.trim()}
                onPress={sendCode}
              />
            </>
          )}
          {step === 2 && verificationToken && (
            <>
              <DsFeedback
                tone="success"
                message="E-mail verificado. Você já pode continuar."
              />
              <AuthAction label="Continuar" onPress={() => go(3)} />
            </>
          )}
          {step === 2 && !verificationToken && (
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
                  label={resend.label}
                  disabled={busy || resend.cooldown > 0}
                  onPress={resendCode}
                />
              </View>
            </>
          )}
          {step === 3 && (
            <>
              <AuthField
                hideLabel
                label="Nome"
                icon="name"
                placeholder="Nome"
                value={firstName}
                onChangeText={setFirstName}
                editable={!busy}
                autoComplete="given-name"
                autoCapitalize="words"
                maxLength={60}
                returnKeyType="next"
              />
              <AuthField
                hideLabel
                label="Sobrenome"
                icon="name"
                placeholder="Sobrenome"
                value={lastName}
                onChangeText={setLastName}
                editable={!busy}
                autoComplete="family-name"
                autoCapitalize="words"
                maxLength={60}
                returnKeyType="next"
                onSubmitEditing={submitName}
              />
              <AuthAction
                label="Continuar"
                disabled={busy || !firstName.trim() || !lastName.trim()}
                onPress={submitName}
              />
            </>
          )}
          {step === 4 && (
            <>
              <AuthField
                hideLabel
                label="Senha"
                icon="password"
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                editable={!busy}
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
                onChangeText={setConfirmation}
                editable={!busy}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                maxLength={72}
                returnKeyType="go"
                onSubmitEditing={submitPassword}
              />
              <AuthAction
                label="Continuar"
                disabled={busy || !password || !confirmation}
                onPress={submitPassword}
              />
            </>
          )}
          {step === 5 && (
            <>
              <View style={localStyles.field}>
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
