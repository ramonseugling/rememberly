import {
  useFonts,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  Quicksand_500Medium,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '../src/session/provider';
import { IntentProvider } from '../src/navigation/provider';
import { NotificationRuntime } from '../src/features/notifications';
import { apiConfiguration } from '../src/config/environment';
import { isDesignCatalogEnabled } from '../src/design-system/availability';

function Navigation() {
  const { state } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={state.status === 'authenticated'}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected
        guard={
          state.status === 'authenticated' &&
          isDesignCatalogEnabled(apiConfiguration.environment, __DEV__)
        }
      >
        <Stack.Screen name="design-system" />
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
  const [loaded, error] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Quicksand_500Medium,
    Quicksand_700Bold,
  });
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: '#fdf9f7',
        }}
      >
        <ActivityIndicator accessibilityLabel="Carregando" />
      </View>
    );
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
