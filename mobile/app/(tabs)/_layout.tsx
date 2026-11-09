import { Tabs } from 'expo-router';
import { AppTabBar } from '../../src/components/app-tab-bar/app-tab-bar';
export default function TabLayout() {
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
    </Tabs>
  );
}
