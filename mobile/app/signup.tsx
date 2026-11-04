import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import {
  AuthAction,
  AuthField,
  AuthPage,
  publicAuth,
  styles,
  useAuthTask,
} from '../src/features/auth/ui';
import { emailError, registrationError } from '../src/features/auth/api';
import { useSession } from '../src/session/provider';

export default function SignupScreen() {
  const { controller } = useSession();
  const task = useAuthTask();
  const [email, setEmail] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [registered, setRegistered] = useState(false);
  function sendCode() {
    const error = emailError(email);
    if (error) {
      task.setMessage(error);
      return;
    }
    void task.run(async (signal) => {
      const address = email.trim().toLowerCase();
      await publicAuth.sendCode(address, signal);
      if (signal.aborted) return;
      setVerifiedEmail(address);
      setCode('');
      return 'Verification code sent. Check your inbox and spam folder. The code expires in 10 minutes; requesting a new code replaces the previous one.';
    });
  }
  function submit() {
    const input = {
      name: name.trim(),
      email: verifiedEmail ?? '',
      password,
      otp_code: code,
      birth_day: Number(day),
      birth_month: Number(month),
      birth_year: Number(year),
      marketing_consent: marketing,
    };
    const error = registrationError(input, confirmation);
    if (error) {
      task.setMessage(error);
      return;
    }
    void task.run(async (signal) => {
      await publicAuth.register(input, signal);
      if (signal.aborted) return;
      setPassword('');
      setConfirmation('');
      setCode('');
      setRegistered(true);
      await controller.login(input.email, input.password);
      return 'Your account was created. If sign-in could not finish, return to sign in with your new password.';
    });
  }
  return (
    <AuthPage
      title="Create your account"
      pending={task.pending}
      message={task.message}
    >
      {registered ? (
        <Text style={styles.text}>
          Your account is ready. Return to sign in if you are still on this
          screen.
        </Text>
      ) : (
        <>
          <AuthField
            label="Email"
            value={email}
            onChangeText={setEmail}
            editable={!task.pending && !verifiedEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {!verifiedEmail ? (
            <AuthAction
              label="Send verification code"
              disabled={task.pending}
              onPress={sendCode}
            />
          ) : (
            <>
              <AuthAction
                label="Use a different email"
                disabled={task.pending}
                onPress={() => {
                  setVerifiedEmail(null);
                  setCode('');
                  task.setMessage(null);
                }}
              />
              <AuthField
                label="Name"
                value={name}
                onChangeText={setName}
                editable={!task.pending}
                maxLength={100}
                autoComplete="name"
              />
              <AuthField
                label="Email verification code"
                value={code}
                onChangeText={setCode}
                editable={!task.pending}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
              />
              <AuthAction
                label="Resend verification code"
                disabled={task.pending}
                onPress={sendCode}
              />
              <AuthField
                label="Password (8–72 characters)"
                value={password}
                onChangeText={setPassword}
                editable={!task.pending}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                maxLength={72}
              />
              <AuthField
                label="Confirm password"
                value={confirmation}
                onChangeText={setConfirmation}
                editable={!task.pending}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                maxLength={72}
              />
              <Text style={styles.text}>
                Your birth date is required. Group members can see your
                birthday.
              </Text>
              <AuthField
                label="Birth day (1–31)"
                value={day}
                onChangeText={setDay}
                editable={!task.pending}
                keyboardType="number-pad"
                maxLength={2}
              />
              <AuthField
                label="Birth month (1–12)"
                value={month}
                onChangeText={setMonth}
                editable={!task.pending}
                keyboardType="number-pad"
                maxLength={2}
              />
              <AuthField
                label="Birth year"
                value={year}
                onChangeText={setYear}
                editable={!task.pending}
                keyboardType="number-pad"
                maxLength={4}
              />
              <View>
                <Text style={styles.text}>
                  Receive product news and marketing emails (optional)
                </Text>
                <Switch
                  accessibilityLabel="Receive product news and marketing emails"
                  value={marketing}
                  onValueChange={setMarketing}
                  disabled={task.pending}
                />
              </View>
              <AuthAction
                label="Create account"
                disabled={task.pending}
                onPress={submit}
              />
            </>
          )}
        </>
      )}
    </AuthPage>
  );
}
