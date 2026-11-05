import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { resetToken } from '../src/navigation/intents';
import { passwordError } from '../src/features/auth/api';
import {
  AuthAction,
  AuthField,
  AuthPage,
  publicAuth,
  styles,
  useAuthTask,
} from '../src/features/auth/ui';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const supplied = resetToken(params.token) ? params.token : '';
  const task = useAuthTask();
  const [token, setToken] = useState(supplied);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (supplied) {
      setToken(supplied);
      router.setParams({ token: undefined });
    }
  }, [supplied]);
  return (
    <AuthPage
      title="Choose a new password"
      pending={task.pending}
      message={task.message}
    >
      {done ? (
        <Text style={styles.text}>
          Your password has been changed. Sign in using your new password.
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            Enter the reset token from your email link, then choose a new
            password.
          </Text>
          <AuthField
            label="Password reset token"
            value={token}
            onChangeText={setToken}
            editable={!task.pending}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
          />
          <AuthField
            label="New password (8–72 characters)"
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
            label="Confirm new password"
            value={confirmation}
            onChangeText={setConfirmation}
            editable={!task.pending}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={72}
          />
          <AuthAction
            label="Change password"
            disabled={task.pending}
            onPress={() => {
              const error = !token.trim()
                ? 'Enter the reset token from your email link.'
                : passwordError(password, confirmation);
              if (error) {
                task.setMessage(error);
                return;
              }
              void task.run(async (signal) => {
                await publicAuth.resetPassword(token.trim(), password, signal);
                if (signal.aborted) return;
                setToken('');
                setPassword('');
                setConfirmation('');
                setDone(true);
                return 'Password changed successfully.';
              });
            }}
          />
          <AuthAction
            label="Request a new reset link"
            disabled={task.pending}
            onPress={() => router.replace('/forgot-password')}
          />
        </>
      )}
    </AuthPage>
  );
}
