import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '../src/session/provider';

function Navigation() {
  const { state } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={state.status === 'authenticated'}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={state.status !== 'authenticated'}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SessionProvider>
        <Navigation />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
