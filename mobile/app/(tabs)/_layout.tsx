import { Calendar, Users, Gift, User } from 'lucide-react-native';
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
        tabBarLabelStyle: { fontSize: 11, fontFamily: theme.fonts.bold },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Minhas Datas',
          tabBarIcon: ({ color }) => <Calendar color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Grupos',
          tabBarIcon: ({ color }) => <Users color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="occasions"
        options={{
          title: 'Comemorativas',
          tabBarIcon: ({ color }) => <Gift color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User color={color} size={20} />,
        }}
      />
    </Tabs>
  );
}
