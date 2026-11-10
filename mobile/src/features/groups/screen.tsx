import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Cake, Plus, Settings, Users } from 'lucide-react-native';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationPrompt } from '../notifications';
import {
  DsBackHeader,
  DsButton,
  DsConfirmSheet,
  DsFeedback,
  DsSegmentedTabs,
  DsText,
  tokens,
} from '../../design-system';
import type { DsSegmentedTab } from '../../design-system';
import { GroupEventsTab } from './group-events-tab';
import { GroupHeader } from './group-header';
import { GroupMembersTab } from './group-members-tab';
import { GroupSettingsTab } from './group-settings-tab';
import { CreateGroupSheet } from './create-group-sheet';
import { GroupRow } from './group-row';
import { GroupsEmpty } from './groups-empty';
import { PhotoSheet } from '../photo/photo-sheet';
import { usePhotoUpload } from '../photo/use-photo-upload';
import { apiConfiguration } from '../../config/environment';
import {
  useAuthenticatedApi,
  usePullRefresh,
  useResource,
} from '../../data/hooks';
import { resourceId } from '../../navigation/intents';
import { useSession } from '../../session/provider';
import { theme } from '../../theme';
import { groupNameError, inviteUrl } from './model';
import type { Group, GroupMember } from './model';

type GroupTab = 'dates' | 'members' | 'settings';
const detailTabs: readonly DsSegmentedTab<GroupTab>[] = [
  {
    id: 'dates',
    label: 'Eventos',
    icon: (color) => <Cake size={16} color={color} />,
  },
  {
    id: 'members',
    label: 'Membros',
    icon: (color) => <Users size={16} color={color} />,
  },
  {
    id: 'settings',
    label: 'Ajustes',
    icon: (color) => <Settings size={16} color={color} />,
  },
];

export function GroupsScreen() {
  const { state } = useSession();
  const userId = state.identity?.user.id;
  return userId ? <GroupContent key={userId} userId={userId} /> : null;
}

function GroupContent({ userId }: { userId: string }) {
  const { request } = useAuthenticatedApi();
  const pull = usePullRefresh();
  const params = useLocalSearchParams<{
    overview?: string;
    groupId?: string | string[];
  }>();
  const groups = useResource<Group[]>('/api/v1/groups');
  const { maybePrompt, element: promptElement } = useNotificationPrompt();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<GroupTab>('dates');
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    label: string;
    action: () => Promise<void>;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [rename, setRename] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);
  const path = selectedId
    ? `/api/v1/groups/${encodeURIComponent(selectedId)}`
    : null;
  const detail = useResource<Group>(path);
  const members = useResource<GroupMember[]>(path ? `${path}/members` : null);
  const group = detail.data;
  const [photoOpen, setPhotoOpen] = useState(false);
  const photo = usePhotoUpload(`${path ?? ''}/photo`, refresh);

  useEffect(() => {
    if (params.overview === '1') {
      setSelectedId(null);
      setError(null);
      router.setParams({ overview: undefined });
    }
  }, [params.overview]);
  useEffect(() => {
    if (resourceId(params.groupId)) {
      setSelectedId(params.groupId);
      setTab('dates');
      router.setParams({ groupId: undefined });
    }
  }, [params.groupId]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    setRename(detail.data?.name ?? '');
  }, [detail.data?.name]);
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

  async function mutate(action: () => Promise<void>) {
    if (busy.current || !alive.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      await action();
    } catch (failure) {
      if (alive.current)
        setError(
          failure instanceof Error
            ? failure.message
            : 'Não foi possível salvar. Confira sua conexão e tente novamente.',
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
    setConfirmation({ title, message, label, action });
  }
  function open(groupId: string) {
    if (busy.current) return;
    setError(null);
    setSaved(false);
    setRename('');
    setTab('dates');
    setSelectedId(groupId);
  }
  function share(item: Group) {
    void Share.share({
      message: `Entrei no Rememberly e criei o grupo ${item.name} — entra com a gente! ${inviteUrl(apiConfiguration.apiOrigin, item.invite_code)}`,
    }).catch(() => {
      if (alive.current)
        setError('Não foi possível compartilhar o convite. Tente novamente.');
    });
  }
  function showCreate() {
    setError(null);
    setSaved(false);
    setCreateOpen(true);
  }
  function create() {
    const validation = groupNameError(name);
    if (validation) {
      setError(validation);
      return;
    }
    const firstGroup = !groups.data?.length;
    void mutate(async () => {
      const created = await request<Group>('/api/v1/groups', {
        method: 'POST',
        body: { name: name.trim() },
      });
      if (!alive.current) return;
      setName('');
      setCreateOpen(false);
      setSelectedId(created.id);
      setTab('dates');
      await groups.reload();
      if (firstGroup) void maybePrompt();
    });
  }
  const isEmptyList =
    !!groups.data && !groups.error && groups.data.length === 0;
  const { state: sessionState } = useSession();
  const userName = sessionState.identity?.user.name ?? '';
  const creator = members.data?.find((member) => member.role === 'owner');
  const createdDate = group?.created_at
    ? new Date(group.created_at).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      })
    : null;
  const creatorLabel =
    group?.role === 'owner'
      ? 'Criado por você'
      : creator
        ? `Criado por ${creator.name}`
        : 'Criado';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          key={selectedId ?? 'list'}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={pull.refreshing}
              onRefresh={() => {
                pull.run(refresh);
              }}
              tintColor={theme.colors.primary}
            />
          }
        >
          {error && !createOpen && <DsFeedback tone="error" message={error} />}
          {pending && !createOpen && (
            <ActivityIndicator
              accessibilityLabel="Salvando alterações"
              color={theme.colors.primary}
            />
          )}
          {!selectedId ? (
            <>
              {isEmptyList ? (
                <GroupsEmpty
                  userName={userName}
                  disabled={pending}
                  onCreate={showCreate}
                />
              ) : (
                <>
                  <View style={styles.intro}>
                    <DsText role="title">Meus grupos</DsText>
                    <DsText role="caption" style={styles.muted}>
                      Organize aniversários compartilhados com amigos, família e
                      colegas.
                    </DsText>
                    <DsButton
                      label="Criar grupo"
                      icon={<Plus size={20} color={tokens.colors.onPrimary} />}
                      disabled={pending}
                      onPress={showCreate}
                      style={styles.start}
                    />
                  </View>
                  {groups.loading && !groups.data && (
                    <ActivityIndicator
                      accessibilityLabel="Carregando grupos"
                      color={tokens.colors.brand}
                    />
                  )}
                  {groups.error && (
                    <View style={styles.listFeedback}>
                      <DsFeedback tone="error" message={groups.error} />
                      <DsButton
                        label="Tentar novamente"
                        variant="outline"
                        onPress={() => {
                          void groups.reload();
                        }}
                      />
                    </View>
                  )}
                  <View style={styles.groupList}>
                    {groups.data?.map((item) => (
                      <GroupRow
                        key={item.id}
                        group={item}
                        disabled={pending}
                        onOpen={() => open(item.id)}
                        onInvite={() => share(item)}
                      />
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            <>
              <DsBackHeader
                label="Voltar para grupos"
                onPress={() => {
                  if (pending) return;
                  setSelectedId(null);
                  setError(null);
                }}
              />
              {detail.loading && !group && (
                <ActivityIndicator
                  accessibilityLabel="Carregando grupo"
                  color={tokens.colors.brand}
                />
              )}
              {detail.error && (
                <View style={styles.listFeedback}>
                  <DsFeedback tone="error" message={detail.error} />
                  <DsButton
                    label="Tentar novamente"
                    variant="outline"
                    onPress={() => {
                      void refresh();
                    }}
                  />
                </View>
              )}
              {group && !detail.error && (
                <>
                  <GroupHeader
                    group={group}
                    subtitle={`${group.member_count} ${group.member_count === 1 ? 'membro' : 'membros'}${createdDate ? ` · ${creatorLabel} em ${createdDate}` : ''}`}
                    disabled={pending}
                    onInvite={() => share(group)}
                    onEditPhoto={
                      group.role === 'owner'
                        ? () => setPhotoOpen(true)
                        : undefined
                    }
                  />
                  <DsSegmentedTabs
                    tabs={detailTabs}
                    value={tab}
                    onChange={(id) => {
                      setTab(id);
                      setError(null);
                      setSaved(false);
                    }}
                  />
                  {error && <DsFeedback tone="error" message={error} />}
                  {pending && (
                    <ActivityIndicator
                      accessibilityLabel="Salvando alterações"
                      color={tokens.colors.brand}
                    />
                  )}
                  {tab !== 'settings' && members.loading && !members.data && (
                    <ActivityIndicator
                      accessibilityLabel="Carregando aniversários e membros"
                      color={tokens.colors.brand}
                    />
                  )}
                  {tab !== 'settings' && members.error && (
                    <View style={styles.listFeedback}>
                      <DsFeedback tone="error" message={members.error} />
                      <DsButton
                        label="Tentar novamente"
                        variant="outline"
                        onPress={() => {
                          void members.reload();
                        }}
                      />
                    </View>
                  )}
                  {tab === 'dates' && members.data && !members.error && (
                    <GroupEventsTab
                      key={group.id}
                      members={members.data}
                      userId={userId}
                      currentMonth={
                        group.current_month ??
                        Number(
                          new Intl.DateTimeFormat('en-US', {
                            month: 'numeric',
                            timeZone: 'America/Sao_Paulo',
                          }).format(new Date()),
                        )
                      }
                    />
                  )}
                  {tab === 'members' && members.data && !members.error && (
                    <GroupMembersTab
                      members={members.data}
                      userId={userId}
                      role={group.role}
                      disabled={pending}
                      onRemove={(member) =>
                        confirm(
                          'Remover membro?',
                          `${member.name} perderá acesso a este grupo.`,
                          'Remover',
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
                  {tab === 'settings' && (
                    <GroupSettingsTab
                      group={group}
                      rename={rename}
                      saved={saved}
                      pending={pending}
                      onChangeName={(value) => {
                        setRename(value);
                        setSaved(false);
                      }}
                      onSave={() => {
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
                          if (alive.current) {
                            await refresh();
                            setSaved(true);
                          }
                        });
                      }}
                      onDelete={() =>
                        confirm(
                          'Deletar grupo?',
                          'Esta ação é permanente e remove o acesso de todos os membros.',
                          'Deletar',
                          async () => {
                            await request(path!, { method: 'DELETE' });
                            if (!alive.current) return;
                            setSelectedId(null);
                            await groups.reload();
                          },
                        )
                      }
                      onLeave={() =>
                        confirm(
                          'Sair do grupo?',
                          'Você perderá acesso. Para entrar novamente, use um convite.',
                          'Sair',
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
      <CreateGroupSheet
        visible={createOpen}
        name={name}
        error={error}
        pending={pending}
        onChangeName={setName}
        onSubmit={create}
        onClose={() => {
          setCreateOpen(false);
          setError(null);
        }}
      />
      {promptElement}
      <PhotoSheet
        visible={photoOpen}
        title="Foto do grupo"
        name={group?.name ?? ''}
        photoUri={group?.photo_url ?? null}
        pending={photo.pending}
        error={photo.error}
        onChoose={(source) => {
          void photo.choose(source).then((changed) => {
            if (changed) setPhotoOpen(false);
          });
        }}
        onRemove={() => {
          void photo.remove().then((changed) => {
            if (changed) setPhotoOpen(false);
          });
        }}
        onClose={() => {
          photo.clearError();
          setPhotoOpen(false);
        }}
      />
      <DsConfirmSheet
        visible={!!confirmation}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        confirmLabel={confirmation?.label ?? ''}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          const current = confirmation;
          setConfirmation(null);
          if (current) void mutate(current.action);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: tokens.tabBarClearance,
    gap: 24,
  },
  intro: { gap: 8 },
  start: { alignSelf: 'stretch', minHeight: 52, marginTop: 6 },
  muted: { color: tokens.colors.textMuted },
  listFeedback: { gap: 12 },
  groupList: { gap: 8 },
  title: {
    color: theme.colors.foreground,
    fontSize: 30,
    fontFamily: theme.fonts.headingBold,
  },
  groupTitle: {
    color: theme.colors.foreground,
    fontSize: 24,
    fontFamily: theme.fonts.headingBold,
  },
  heading: {
    color: theme.colors.foreground,
    fontSize: 16,
    fontFamily: theme.fonts.heading,
  },
  body: { color: theme.colors.muted, fontSize: 14, lineHeight: 21 },
  caption: { color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  empty: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(235, 109, 151, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(235, 109, 151, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(235, 109, 151, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: theme.colors.primary,
    fontSize: 18,
    fontFamily: theme.fonts.heading,
  },
  cta: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  back: { flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 44 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexGrow: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: theme.colors.primary },
  tabText: { color: theme.colors.muted, fontSize: 13 },
  activeText: { color: theme.colors.primary },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 239, 234, 0.45)',
  },
  remove: {
    width: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  memberName: { fontSize: 14, color: theme.colors.foreground },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
  label: {
    color: theme.colors.foreground,
    fontSize: 14,
    fontFamily: theme.fonts.bold,
  },
  input: {
    color: theme.colors.foreground,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  destructive: { color: theme.colors.destructive, fontSize: 14 },
  dangerTitle: {
    color: theme.colors.destructive,
    fontSize: 14,
    fontFamily: theme.fonts.bold,
  },
  danger: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 24,
    gap: 12,
  },
});
