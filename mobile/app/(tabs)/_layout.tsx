import { Redirect, Tabs } from 'expo-router';
import { AppTabBar } from '../../src/components/app-tab-bar/app-tab-bar';
import { useOnboarding } from '../../src/features/onboarding/use-onboarding';

export default function TabLayout() {
  const { status } = useOnboarding();
  if (status === 'loading') return null;
  if (status === 'pending') return <Redirect href="/onboarding" />;
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="events" options={{ title: 'Eventos' }} />
      <Tabs.Screen name="groups" options={{ title: 'Grupos' }} />
      <Tabs.Screen name="gifts" options={{ title: 'Presentes' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      <Tabs.Screen
        name="occasions"
        options={{ title: 'Especiais', href: null }}
      />
      <Tabs.Screen name="legal" options={{ title: 'Termos', href: null }} />
      <Tabs.Screen name="account" options={{ title: 'Conta', href: null }} />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'Notificações', href: null }}
      />
    </Tabs>
  );
}
