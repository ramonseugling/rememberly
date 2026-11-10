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
      backBehavior="history"
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="events" options={{ title: 'Eventos' }} />
      <Tabs.Screen name="groups" options={{ title: 'Grupos' }} />
      <Tabs.Screen name="gifts" options={{ title: 'Presentes' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="occasions" options={{ title: 'Especiais' }} />
      <Tabs.Screen
        name="personal"
        options={{ title: 'Informações pessoais' }}
      />
      <Tabs.Screen name="legal" options={{ title: 'Termos' }} />
      <Tabs.Screen name="account" options={{ title: 'Conta' }} />
      <Tabs.Screen
        name="gifts-groups"
        options={{ title: 'Listas dos grupos' }}
      />
      <Tabs.Screen name="birthday" options={{ title: 'Aniversário' }} />
      <Tabs.Screen
        name="gifts-member"
        options={{ title: 'Lista de presentes' }}
      />
      <Tabs.Screen name="notifications" options={{ title: 'Notificações' }} />
    </Tabs>
  );
}
