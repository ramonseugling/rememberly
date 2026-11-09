import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Cake,
  Plus,
  Settings,
  Share2,
  Users,
  X,
} from 'lucide-react-native';
import {
  ActivityIndicator,
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
import { BottomSheet } from '../../components/bottom-sheet/bottom-sheet';
import { BrandButton } from '../../components/brand-button/brand-button';
import { Text } from '../../components/brand-text/brand-text';
import { GroupCard } from '../../components/group-card/group-card';
import { GroupDates } from '../../components/group-dates/group-dates';
import { DsConfirmSheet } from '../../design-system';
import { apiConfiguration } from '../../config/environment';
import { useAuthenticatedApi, useResource } from '../../data/hooks';
import { resourceId } from '../../navigation/intents';
import { useSession } from '../../session/provider';
import { theme } from '../../theme';
import {
  birthdayLabel,
  daysLabel,
  orderedMembers,
  canRemoveMember,
  groupNameError,
  inviteUrl,
} from './model';
import type { Group, GroupMember } from './model';

type GroupTab = 'dates' | 'members' | 'settings';
const tabs = [
  { id: 'dates', label: 'Datas', Icon: Cake },
  { id: 'members', label: 'Membros', Icon: Users },
  { id: 'settings', label: 'Configurações', Icon: Settings },
] as const;

export function GroupsScreen() {
  const { state } = useSession();
  const userId = state.identity?.user.id;
  return userId ? <GroupContent key={userId} userId={userId} /> : null;
}

function GroupContent({ userId }: { userId: string }) {
  const { request } = useAuthenticatedApi();
  const params = useLocalSearchParams<{
    overview?: string;
    groupId?: string | string[];
  }>();
  const groups = useResource<Group[]>('/api/v1/groups');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<GroupTab>('dates');
  const [expandedJoin, setExpandedJoin] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    label: string;
    action: () => Promise<void>;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
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
    });
  }
  function join() {
    if (!code.trim()) {
      setError('Informe o código de convite.');
      return;
    }
    void mutate(async () => {
      const joined = await request<Group>('/api/v1/groups/join', {
        method: 'POST',
        body: { invite_code: code.trim() },
      });
      if (!alive.current) return;
      setCode('');
      setExpandedJoin(false);
      setSelectedId(joined.id);
      setTab('dates');
      await groups.reload();
    });
  }
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
              refreshing={
                selectedId ? detail.loading || members.loading : groups.loading
              }
              onRefresh={() => {
                void refresh();
              }}
              tintColor={theme.colors.primary}
            />
          }
        >
          {error && !createOpen && (
            <Text accessibilityRole="alert" style={styles.destructive}>
              {error}
            </Text>
          )}
          {pending && !createOpen && (
            <ActivityIndicator
              accessibilityLabel="Salvando alterações"
              color={theme.colors.primary}
            />
          )}
          {!selectedId ? (
            <>
              <View style={styles.intro}>
                <Text accessibilityRole="header" style={styles.title}>
                  Meus grupos
                </Text>
                <Text style={styles.body}>
                  Organize aniversários compartilhados com amigos, família e
                  colegas.
                </Text>
                <BrandButton
                  label="Criar grupo"
                  onPress={showCreate}
                  disabled={pending}
                  icon={<Plus size={17} color="white" />}
                  style={styles.start}
                />
              </View>
              {groups.loading && !groups.data && (
                <ActivityIndicator
                  accessibilityLabel="Carregando grupos"
                  color={theme.colors.primary}
                />
              )}
              {groups.error && (
                <View style={styles.card}>
                  <Text accessibilityRole="alert" style={styles.body}>
                    {groups.error}
                  </Text>
                  <BrandButton
                    label="Tentar novamente"
                    variant="outline"
                    onPress={() => {
                      void groups.reload();
                    }}
                  />
                </View>
              )}
              {groups.data?.length === 0 && (
                <View style={[styles.card, styles.empty]}>
                  <View style={styles.avatar}>
                    <Users size={28} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.heading}>
                    Comemore junto de quem importa
                  </Text>
                  <Text style={styles.body}>
                    Crie um grupo e compartilhe aniversários com família, amigos
                    ou colegas.
                  </Text>
                  <BrandButton
                    label="Criar meu primeiro grupo"
                    onPress={showCreate}
                    disabled={pending}
                  />
                </View>
              )}
              {groups.data?.map((item) => (
                <GroupCard
                  key={item.id}
                  group={item}
                  pending={pending}
                  onOpen={() => open(item.id)}
                  onInvite={() => share(item)}
                />
              ))}
              {!!groups.data?.length && (
                <View style={styles.cta}>
                  <Text style={styles.heading}>
                    Mais pessoas, mais celebrações
                  </Text>
                  <Text style={styles.body}>
                    Crie um novo grupo e convide quem faz parte da sua vida.
                  </Text>
                  <BrandButton
                    label="Criar grupo"
                    onPress={showCreate}
                    disabled={pending}
                    icon={<Plus size={16} color="white" />}
                    style={styles.start}
                  />
                </View>
              )}
              <BrandButton
                label={
                  expandedJoin
                    ? 'Fechar convite'
                    : 'Já tem um código de convite?'
                }
                variant="outline"
                onPress={() => setExpandedJoin((value) => !value)}
                disabled={pending}
              />
              {expandedJoin && (
                <View style={styles.card}>
                  <Text style={styles.heading}>Entrar em um grupo</Text>
                  <TextInput
                    style={styles.input}
                    accessibilityLabel="Código de convite"
                    placeholder="Código de convite"
                    placeholderTextColor={theme.colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={code}
                    onChangeText={setCode}
                    editable={!pending}
                  />
                  <BrandButton
                    label="Entrar no grupo"
                    onPress={join}
                    pending={pending}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                disabled={pending}
                accessibilityState={{ disabled: pending }}
                onPress={() => {
                  setSelectedId(null);
                  setError(null);
                }}
                style={styles.back}
              >
                <ArrowLeft size={16} color={theme.colors.muted} />
                <Text style={styles.body}>Voltar para grupos</Text>
              </Pressable>
              {detail.loading && !group && (
                <ActivityIndicator
                  accessibilityLabel="Carregando grupo"
                  color={theme.colors.primary}
                />
              )}
              {detail.error && (
                <View style={styles.card}>
                  <Text accessibilityRole="alert" style={styles.body}>
                    {detail.error}
                  </Text>
                  <BrandButton
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
                  <View style={styles.card}>
                    <View style={styles.largeAvatar}>
                      <Users size={28} color={theme.colors.primary} />
                    </View>
                    <View style={styles.intro}>
                      <Text
                        accessibilityRole="header"
                        style={styles.groupTitle}
                      >
                        {group.name}
                      </Text>
                      <Text style={styles.body}>
                        {group.member_count}{' '}
                        {group.member_count === 1 ? 'membro' : 'membros'}
                        {createdDate
                          ? ` · ${creatorLabel} em ${createdDate}`
                          : ''}
                      </Text>
                    </View>
                    <BrandButton
                      label="Convidar"
                      onPress={() => share(group)}
                      disabled={pending}
                      icon={<Share2 size={16} color="white" />}
                      style={styles.start}
                    />
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabs}
                  >
                    {tabs.map(({ id, label, Icon }) => (
                      <Pressable
                        key={id}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: tab === id }}
                        onPress={() => {
                          setTab(id);
                          setError(null);
                          setSaved(false);
                        }}
                        style={[styles.tab, tab === id && styles.activeTab]}
                      >
                        <Icon
                          size={16}
                          color={
                            tab === id
                              ? theme.colors.primary
                              : theme.colors.muted
                          }
                        />
                        <Text
                          style={[
                            styles.tabText,
                            tab === id && styles.activeText,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {tab !== 'settings' && (
                    <>
                      {members.loading && !members.data && (
                        <ActivityIndicator
                          accessibilityLabel="Carregando aniversários e membros"
                          color={theme.colors.primary}
                        />
                      )}
                      {members.error && (
                        <View style={styles.card}>
                          <Text accessibilityRole="alert" style={styles.body}>
                            {members.error}
                          </Text>
                          <BrandButton
                            label="Tentar novamente"
                            variant="outline"
                            onPress={() => {
                              void members.reload();
                            }}
                          />
                        </View>
                      )}
                    </>
                  )}
                  {tab === 'dates' && members.data && !members.error && (
                    <GroupDates
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
                    <View style={styles.card}>
                      <Text accessibilityRole="header" style={styles.heading}>
                        Membros do grupo ({members.data.length})
                      </Text>
                      {orderedMembers(members.data).map((member) => (
                        <View key={member.id} style={styles.member}>
                          <View style={styles.row}>
                            <View style={styles.smallAvatar}>
                              <Text style={styles.initial}>
                                {member.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.grow}>
                              <Text style={styles.memberName}>
                                {member.name}
                                {member.id === userId ? ' (você)' : ''}
                              </Text>
                              <Text style={styles.caption}>
                                {member.role === 'owner' ? 'Criador · ' : ''}
                                {birthdayLabel(member)}
                                {member.isNextYear
                                  ? ' · Ano que vem'
                                  : member.daysUntil !== null
                                    ? ` · ${daysLabel(member.daysUntil)}`
                                    : ''}
                              </Text>
                            </View>
                          </View>
                          {canRemoveMember(group.role, userId, member) && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Remover ${member.name}`}
                              accessibilityState={{ disabled: pending }}
                              style={styles.remove}
                              disabled={pending}
                              onPress={() =>
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
                            >
                              <X size={18} color={theme.colors.muted} />
                            </Pressable>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                  {tab === 'settings' && (
                    <View style={styles.card}>
                      {group.role === 'owner' ? (
                        <>
                          <Text style={styles.label}>Nome do grupo</Text>
                          <TextInput
                            style={styles.input}
                            accessibilityLabel="Nome do grupo"
                            value={rename}
                            onChangeText={(value) => {
                              setRename(value);
                              setSaved(false);
                            }}
                            editable={!pending}
                            maxLength={100}
                          />
                          <BrandButton
                            label="Salvar"
                            variant="solid"
                            pending={pending}
                            disabled={rename.trim() === group.name}
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
                                if (alive.current) {
                                  await refresh();
                                  setSaved(true);
                                }
                              });
                            }}
                          />
                          {saved && (
                            <Text
                              accessibilityLiveRegion="polite"
                              style={styles.body}
                            >
                              Nome do grupo atualizado.
                            </Text>
                          )}
                          <View style={styles.danger}>
                            <Text style={styles.dangerTitle}>
                              Zona de perigo
                            </Text>
                            <Text style={styles.caption}>
                              Deletar o grupo remove todos os membros
                              permanentemente.
                            </Text>
                            <BrandButton
                              label="Deletar grupo"
                              variant="destructive"
                              disabled={pending}
                              onPress={() =>
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
                            />
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={styles.heading}>Sair do grupo</Text>
                          <Text style={styles.body}>
                            Você perde acesso aos aniversários compartilhados
                            pelo grupo.
                          </Text>
                          <BrandButton
                            label="Sair do grupo"
                            variant="destructive"
                            disabled={pending}
                            onPress={() =>
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
                        </>
                      )}
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomSheet
        title="Criar grupo"
        visible={createOpen}
        pending={pending}
        onClose={() => {
          setCreateOpen(false);
          setError(null);
        }}
      >
        <Text style={styles.label}>Nome do grupo</Text>
        <TextInput
          style={styles.input}
          accessibilityLabel="Nome do novo grupo"
          placeholder="Ex: Família Silva, Amigos do trabalho"
          placeholderTextColor={theme.colors.muted}
          value={name}
          onChangeText={setName}
          editable={!pending}
          maxLength={100}
          autoCapitalize="sentences"
          returnKeyType="done"
          onSubmitEditing={create}
        />
        {error && (
          <Text accessibilityRole="alert" style={styles.destructive}>
            {error}
          </Text>
        )}
        <BrandButton label="Criar grupo" pending={pending} onPress={create} />
      </BottomSheet>
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
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 24,
  },
  intro: { gap: 8 },
  start: { alignSelf: 'flex-start' },
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
