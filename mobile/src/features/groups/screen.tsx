import { Text } from '../../components/brand-text/brand-text';
import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { resourceId } from '../../navigation/intents';
import {
  ActivityIndicator,
  Modal,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiConfiguration } from '../../config/environment';
import { useAuthenticatedApi, useResource } from '../../data/hooks';
import { useSession } from '../../session/provider';
import { useScreenAddAction } from '../../navigation/add-action';
import { theme } from '../../theme';
import {
  birthdayLabel,
  canRemoveMember,
  groupNameError,
  inviteUrl,
} from './model';
import type { Group, GroupMember } from './model';

function Button({
  label,
  onPress,
  disabled = false,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonText, destructive && styles.destructive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function GroupsScreen() {
  const { state } = useSession();
  const userId = state.identity?.user.id;
  return userId ? <GroupContent key={userId} userId={userId} /> : null;
}

function GroupContent({ userId }: { userId: string }) {
  const { request } = useAuthenticatedApi();
  const params = useLocalSearchParams<{ groupId?: string | string[] }>();
  const groups = useResource<Group[]>('/api/v1/groups');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (resourceId(params.groupId)) {
      setSelectedId(params.groupId);
      router.setParams({ groupId: undefined });
    }
  }, [params.groupId]);
  const path = selectedId
    ? `/api/v1/groups/${encodeURIComponent(selectedId)}`
    : null;
  const detail = useResource<Group>(path);
  const members = useResource<GroupMember[]>(path ? `${path}/members` : null);
  const [createOpen, setCreateOpen] = useState(false);
  useScreenAddAction('Criar grupo', () => {
    if (!busy.current) {
      setSelectedId(null);
      setCreateOpen(true);
    }
  });
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [rename, setRename] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (!selectedId) return;
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (!busy.current) {
            setSelectedId(null);
            setError(null);
          }
          return true;
        },
      );
      return () => subscription.remove();
    }, [selectedId]),
  );
  useEffect(() => {
    setRename(detail.data?.name ?? '');
  }, [detail.data?.name]);

  async function mutate(action: () => Promise<void>) {
    if (busy.current || !alive.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      if (alive.current)
        setError(
          failure instanceof Error
            ? failure.message
            : 'Unable to save. Check your connection and try again.',
        );
    } finally {
      busy.current = false;
      if (alive.current) setPending(false);
    }
  }
  async function refresh() {
    await Promise.all([groups.reload(), detail.reload(), members.reload()]);
  }
  function confirm(
    title: string,
    message: string,
    label: string,
    action: () => Promise<void>,
  ) {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        style: 'destructive',
        onPress: () => {
          void mutate(action);
        },
      },
    ]);
  }
  function open(groupId: string) {
    if (busy.current) return;
    setError(null);
    setRename('');
    setSelectedId(groupId);
  }
  const group = detail.data;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={
                selectedId ? detail.loading || members.loading : groups.loading
              }
              onRefresh={() => {
                void refresh();
              }}
            />
          }
        >
          <Text style={styles.brand}>Rememberly</Text>
          {selectedId && (
            <Button
              label="Back to groups"
              disabled={pending}
              onPress={() => {
                setSelectedId(null);
                setError(null);
              }}
            />
          )}
          <Text accessibilityRole="header" style={styles.title}>
            {selectedId ? (group?.name ?? 'Group') : 'Your groups'}
          </Text>
          {pending && (
            <View accessibilityLiveRegion="polite">
              <ActivityIndicator />
              <Text style={styles.body}>Saving…</Text>
            </View>
          )}
          {error && (
            <Text accessibilityRole="alert" style={styles.destructive}>
              {error}
            </Text>
          )}
          {!selectedId ? (
            <>
              <Text style={styles.body}>
                Celebrate with family, friends, and your communities. Pull down
                to refresh.
              </Text>
              {groups.loading && !groups.data && (
                <ActivityIndicator accessibilityLabel="Loading groups" />
              )}
              {groups.error && (
                <View style={styles.card}>
                  <Text accessibilityRole="alert" style={styles.body}>
                    {groups.error}
                  </Text>
                  <Button
                    label="Retry groups"
                    onPress={() => {
                      void groups.reload();
                    }}
                  />
                </View>
              )}
              {groups.data?.length === 0 && (
                <Text style={styles.body}>
                  No groups yet. Create a group or join with an invite code.
                </Text>
              )}
              {groups.data?.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.heading}>{item.name}</Text>
                  <Text style={styles.body}>
                    {item.member_count}{' '}
                    {item.member_count === 1 ? 'member' : 'members'} ·{' '}
                    {item.role === 'owner' ? 'Owner' : 'Member'}
                  </Text>
                  <Button
                    label={`Open ${item.name}`}
                    disabled={pending}
                    onPress={() => open(item.id)}
                  />
                </View>
              ))}
              <Button
                label="Criar grupo"
                disabled={pending}
                onPress={() => setCreateOpen(true)}
              />
              <Modal
                visible={createOpen}
                animationType="slide"
                onRequestClose={() => {
                  if (!pending) setCreateOpen(false);
                }}
              >
                <SafeAreaView style={styles.safeArea}>
                  <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  >
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={styles.content}
                    >
                      <View style={styles.card}>
                        <Text accessibilityRole="header" style={styles.heading}>
                          Criar grupo
                        </Text>
                        {error && (
                          <Text
                            accessibilityRole="alert"
                            style={styles.destructive}
                          >
                            {error}
                          </Text>
                        )}
                        <TextInput
                          style={styles.input}
                          accessibilityLabel="Nome do novo grupo"
                          placeholder="Nome do grupo"
                          placeholderTextColor={theme.colors.muted}
                          value={name}
                          onChangeText={setName}
                          editable={!pending}
                          maxLength={100}
                        />
                        <Button
                          label="Criar grupo"
                          disabled={pending}
                          onPress={() => {
                            const validation = groupNameError(name);
                            if (validation) {
                              setError(validation);
                              return;
                            }
                            void mutate(async () => {
                              const created = await request<Group>(
                                '/api/v1/groups',
                                {
                                  method: 'POST',
                                  body: { name: name.trim() },
                                },
                              );
                              if (!alive.current) return;
                              setName('');
                              setCreateOpen(false);
                              setSelectedId(created.id);
                              await groups.reload();
                            });
                          }}
                        />
                        <Button
                          label="Cancelar"
                          disabled={pending}
                          onPress={() => setCreateOpen(false)}
                        />
                      </View>
                    </ScrollView>
                  </KeyboardAvoidingView>
                </SafeAreaView>
              </Modal>
              <View style={styles.card}>
                <Text accessibilityRole="header" style={styles.heading}>
                  Join a group
                </Text>
                <TextInput
                  style={styles.input}
                  accessibilityLabel="Invitation code"
                  placeholder="Invitation code"
                  placeholderTextColor={theme.colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={code}
                  onChangeText={setCode}
                  editable={!pending}
                />
                <Button
                  label="Join group"
                  disabled={pending}
                  onPress={() => {
                    if (!code.trim()) {
                      setError('Enter an invitation code.');
                      return;
                    }
                    void mutate(async () => {
                      const joined = await request<Group>(
                        '/api/v1/groups/join',
                        { method: 'POST', body: { invite_code: code.trim() } },
                      );
                      if (!alive.current) return;
                      setCode('');
                      setSelectedId(joined.id);
                      await groups.reload();
                    });
                  }}
                />
              </View>
            </>
          ) : (
            <>
              {detail.loading && !group && (
                <ActivityIndicator accessibilityLabel="Loading group" />
              )}
              {detail.error && (
                <View style={styles.card}>
                  <Text accessibilityRole="alert" style={styles.body}>
                    {detail.error}
                  </Text>
                  <Button
                    label="Retry group"
                    onPress={() => {
                      void refresh();
                    }}
                  />
                </View>
              )}
              {group && !detail.error && (
                <>
                  <View style={styles.card}>
                    <Text style={styles.body}>
                      {group.member_count} members ·{' '}
                      {group.role === 'owner'
                        ? 'You own this group'
                        : 'You are a member'}
                    </Text>
                    <Text selectable style={styles.body}>
                      Invite code: {group.invite_code}
                    </Text>
                    <Button
                      label="Share invitation"
                      disabled={pending}
                      onPress={() => {
                        void Share.share({
                          message: `Join ${group.name} on Rememberly: ${inviteUrl(apiConfiguration.apiOrigin, group.invite_code)}`,
                        }).catch(() => {
                          if (alive.current)
                            setError(
                              'Unable to share the invitation. Try again.',
                            );
                        });
                      }}
                    />
                  </View>
                  <View style={styles.card}>
                    <Text accessibilityRole="header" style={styles.heading}>
                      Members and birthdays
                    </Text>
                    {members.loading && !members.data && (
                      <ActivityIndicator accessibilityLabel="Loading members" />
                    )}
                    {members.error && (
                      <>
                        <Text accessibilityRole="alert" style={styles.body}>
                          {members.error}
                        </Text>
                        <Button
                          label="Retry members"
                          onPress={() => {
                            void members.reload();
                          }}
                        />
                      </>
                    )}
                    {members.data?.length === 0 && (
                      <Text style={styles.body}>No members to display.</Text>
                    )}
                    {members.data?.map((member) => (
                      <View key={member.id} style={styles.member}>
                        <Text style={styles.heading}>
                          {member.name}
                          {member.id === userId ? ' (you)' : ''}
                        </Text>
                        <Text style={styles.body}>
                          {member.role === 'owner' ? 'Owner' : 'Member'} ·{' '}
                          {birthdayLabel(member)}
                        </Text>
                        {canRemoveMember(group.role, userId, member) && (
                          <Button
                            label={`Remove ${member.name}`}
                            disabled={pending}
                            destructive
                            onPress={() =>
                              confirm(
                                'Remove member?',
                                `${member.name} will lose access to this group.`,
                                'Remove',
                                async () => {
                                  await request(
                                    `${path}/members/${encodeURIComponent(member.id)}`,
                                    { method: 'DELETE' },
                                  );
                                  if (alive.current) await refresh();
                                },
                              )
                            }
                          />
                        )}
                      </View>
                    ))}
                  </View>
                  {group.role === 'owner' ? (
                    <View style={styles.card}>
                      <Text accessibilityRole="header" style={styles.heading}>
                        Manage group
                      </Text>
                      <TextInput
                        style={styles.input}
                        accessibilityLabel="Rename group"
                        value={rename}
                        onChangeText={setRename}
                        editable={!pending}
                        maxLength={100}
                      />
                      <Button
                        label="Save group name"
                        disabled={pending}
                        onPress={() => {
                          const validation = groupNameError(rename);
                          if (validation) {
                            setError(validation);
                            return;
                          }
                          void mutate(async () => {
                            await request(path!, {
                              method: 'PATCH',
                              body: { name: rename.trim() },
                            });
                            if (alive.current) await refresh();
                          });
                        }}
                      />
                      <Text style={styles.body}>
                        Owners must delete their group to close it.
                      </Text>
                      <Button
                        label="Delete group"
                        destructive
                        disabled={pending}
                        onPress={() =>
                          confirm(
                            'Delete group?',
                            'This permanently deletes the group and removes access for every member.',
                            'Delete',
                            async () => {
                              await request(path!, { method: 'DELETE' });
                              if (!alive.current) return;
                              setSelectedId(null);
                              await groups.reload();
                            },
                          )
                        }
                      />
                    </View>
                  ) : (
                    <Button
                      label="Leave group"
                      destructive
                      disabled={pending}
                      onPress={() =>
                        confirm(
                          'Leave group?',
                          'You will lose access. You can join again with an invitation code.',
                          'Leave',
                          async () => {
                            await request(
                              `${path}/members/${encodeURIComponent(userId)}`,
                              { method: 'DELETE' },
                            );
                            if (!alive.current) return;
                            setSelectedId(null);
                            await groups.reload();
                          },
                        )
                      }
                    />
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.large, gap: theme.spacing.medium },
  brand: { color: theme.colors.primary, fontSize: 18, fontWeight: '700' },
  title: {
    color: theme.colors.foreground,
    fontSize: 32,
    fontFamily: theme.fonts.heading,
  },
  heading: { color: theme.colors.foreground, fontSize: 20, fontWeight: '600' },
  body: { color: theme.colors.muted, fontSize: 16, lineHeight: 24 },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.spacing.medium,
    gap: theme.spacing.medium,
  },
  member: {
    gap: theme.spacing.small,
    paddingVertical: theme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  input: {
    color: theme.colors.foreground,
    fontSize: 17,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 48,
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
  },
  buttonText: {
    color: theme.colors.foreground,
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: { opacity: 0.45 },
  destructive: { color: '#a62342', fontSize: 16 },
});
