import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../src/session/provider';
import { theme } from '../../src/theme';

export default function ProfileScreen() {
  const { state, controller } = useSession();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.heading}>
          Your profile
        </Text>
        <Text style={styles.name}>{state.identity?.user.name}</Text>
        <Text style={styles.text}>{state.identity?.user.email}</Text>
        {state.message && (
          <Text accessibilityRole="alert" style={styles.text}>
            {state.message}
          </Text>
        )}
        <Text style={styles.text}>
          You are signed in. Editing your profile and notification settings are
          not available in this app yet.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void controller.logout();
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 20 },
  heading: { fontSize: 32, color: theme.colors.foreground, fontWeight: '700' },
  name: { fontSize: 24, color: theme.colors.foreground, fontWeight: '600' },
  text: { fontSize: 17, color: theme.colors.muted, lineHeight: 26 },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
