import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { emailError } from '../src/features/auth/api';
import {
  AuthAction,
  AuthField,
  AuthPage,
  publicAuth,
  styles,
  useAuthTask,
} from '../src/features/auth/ui';

export default function ForgotPasswordScreen() {
  const task = useAuthTask();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <AuthPage
      title="Reset your password"
      pending={task.pending}
      message={task.message}
    >
      <Text style={styles.text}>
        Enter your account email. If it is registered, we will send a password
        reset link.
      </Text>
      <AuthField
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setSent(false);
        }}
        editable={!task.pending}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <AuthAction
        label={sent ? 'Send reset link again' : 'Send reset link'}
        disabled={task.pending}
        onPress={() => {
          const error = emailError(email);
          if (error) {
            task.setMessage(error);
            return;
          }
          void task.run(async (signal) => {
            const result = await publicAuth.forgotPassword(email, signal);
            if (signal.aborted) return;
            setSent(true);
            return result.googleOnly
              ? 'This account uses Google sign-in. Continue with Google on the Rememberly website; Google sign-in is not available in this app yet.'
              : 'If this email is registered, you will receive a reset link. Check your inbox and spam folder. You can open the link on the website or enter its token in this app.';
          });
        }}
      />
      <AuthAction
        label="Enter a reset token"
        disabled={task.pending}
        onPress={() => router.push('/reset-password')}
      />
    </AuthPage>
  );
}
