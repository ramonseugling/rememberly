import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '../src/session/provider';
import { IntentProvider } from '../src/navigation/provider';
import { NotificationRuntime } from '../src/features/notifications';

function Navigation() {
  const { state } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={state.status === 'authenticated'}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={state.status !== 'authenticated'}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="join-group" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SessionProvider>
        <IntentProvider>
          <NotificationRuntime />
          <Navigation />
        </IntentProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
