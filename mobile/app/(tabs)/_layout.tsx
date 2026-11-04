import { Tabs } from 'expo-router';
import { theme } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: { backgroundColor: theme.colors.card },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dates' }} />
      <Tabs.Screen name="groups" options={{ title: 'Groups' }} />
      <Tabs.Screen name="occasions" options={{ title: 'Occasions' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
