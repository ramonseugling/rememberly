import { router, useLocalSearchParams } from 'expo-router';
import { useAuthenticatedApi } from '../src/data/hooks';
import { useSession } from '../src/session/provider';
import { useIntents } from '../src/navigation/provider';
import { inviteCode, resourceId } from '../src/navigation/intents';
import { AuthAction, useAuthTask } from '../src/features/auth/ui';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { theme } from '../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JoinGroupScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const code = inviteCode(params.code) ? params.code : null;
  const { state, controller } = useSession();
  const { request } = useAuthenticatedApi();
  const { enqueue, clear } = useIntents();
  const task = useAuthTask();
  const authenticated = state.status === 'authenticated';
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Group invitation
        </Text>
        {task.message && (
          <Text accessibilityRole="alert" style={styles.text}>
            {task.message}
          </Text>
        )}
        <Text style={styles.text}>
          {code
            ? 'You have been invited to a Rememberly group. Joining shares your profile and birthday with its members. Confirm to join using your signed-in account.'
            : 'This invitation link is invalid. Ask the group owner for a new invitation.'}
        </Text>
        {code &&
          (authenticated ? (
            <AuthAction
              label="Confirm and join group"
              disabled={task.pending}
              onPress={() => {
                const owner = state.identity?.user.id;
                void task.run(async (signal) => {
                  const group = await request<{ id: string }>(
                    '/api/v1/groups/join',
                    { method: 'POST', body: { invite_code: code }, signal },
                  );
                  if (
                    signal.aborted ||
                    controller.getSnapshot().identity?.user.id !== owner
                  )
                    return;
                  if (!resourceId(group.id))
                    throw new Error(
                      'The group response was invalid. Open Groups to check membership.',
                    );
                  clear();
                  router.replace({
                    pathname: '/(tabs)/groups',
                    params: { groupId: group.id },
                  });
                });
              }}
            />
          ) : (
            <>
              <AuthAction
                label="Sign in to continue"
                disabled={task.pending || state.status === 'restoring'}
                onPress={() => {
                  enqueue({ kind: 'invitation', code });
                  router.push('/login');
                }}
              />
              <AuthAction
                label="Create an account"
                disabled={task.pending || state.status === 'restoring'}
                onPress={() => {
                  enqueue({ kind: 'invitation', code });
                  router.push('/signup');
                }}
              />
            </>
          ))}
        <AuthAction
          label="Cancel invitation"
          disabled={task.pending}
          onPress={() => {
            clear();
            router.replace('/');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 16, flexGrow: 1 },
  title: {
    color: theme.colors.foreground,
    fontSize: 32,
    fontFamily: theme.fonts.heading,
  },
  text: { color: theme.colors.foreground, fontSize: 16, lineHeight: 24 },
});
