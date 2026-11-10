import { router } from 'expo-router';
import {
  Cake,
  CalendarPlus,
  ChevronRight,
  Plus,
  Users,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsAvatar,
  DsDaysBadge,
  DsButton,
  DsEmptyIcon,
  DsEmptyState,
  DsFeedback,
  DsRow,
  DsText,
  tokens,
} from '../../design-system';
import { usePullRefresh, useResource } from '../../data/hooks';
import { useSession } from '../../session/provider';
import type { Agenda } from '../dates/model';
import { GroupAvatar } from '../groups/group-avatar';
import type { Group } from '../groups/model';
import type { ProfileUser } from '../account/forms';
import { firstName, homeBirthdays, homeGroups } from './model';

export function HomeScreen() {
  const { state } = useSession();
  const profile = useResource<{ user: ProfileUser }>('/api/v1/mobile/me');
  const agenda = useResource<Agenda>('/api/v1/mobile/agenda');
  const groups = useResource<Group[]>('/api/v1/groups');
  const name = firstName(
    profile.data?.user.name ?? state.identity?.user.name ?? '',
  );
  const birthdays = homeBirthdays(agenda.data?.items ?? []);
  const pull = usePullRefresh();
  const refresh = () => {
    pull.run(() =>
      Promise.all([profile.reload(), agenda.reload(), groups.reload()]),
    );
  };
  const allGroups = () =>
    router.navigate({ pathname: '/(tabs)/groups', params: { overview: '1' } });
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pull.refreshing}
            onRefresh={refresh}
            tintColor={tokens.colors.brand}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.greeting}>
            <DsText role="title">Olá, {name}! 👋</DsText>
            <DsText role="caption">Aqui estão suas próximas celebrações</DsText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir meu perfil"
            onPress={() => router.navigate('/(tabs)/profile')}
          >
            <DsAvatar
              name={name}
              size={48}
              photoUri={profile.data?.user.avatar_url}
            />
          </Pressable>
        </View>
        <View style={styles.heading}>
          <DsText role="section" style={styles.headingText}>
            Próximos eventos
          </DsText>
          {birthdays.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver todos os eventos"
              onPress={() => router.navigate('/(tabs)/events')}
              style={styles.all}
            >
              <DsText role="caption" style={styles.link}>
                Ver todos
              </DsText>
            </Pressable>
          )}
        </View>
        {agenda.loading && (
          <ActivityIndicator
            accessibilityLabel="Carregando próximos eventos"
            color={tokens.colors.brand}
          />
        )}
        {agenda.error && (
          <>
            <DsFeedback tone="error" message={agenda.error} />
            <DsButton
              variant="text"
              label="Tentar carregar eventos novamente"
              onPress={() => {
                void agenda.reload();
              }}
            />
          </>
        )}
        {!agenda.loading && !agenda.error && !birthdays.length && (
          <DsEmptyState
            compact
            illustration={
              <DsEmptyIcon>
                <CalendarPlus size={26} color={tokens.colors.brand} />
              </DsEmptyIcon>
            }
            title="Nenhum evento por aqui"
            description="Cadastre aniversários e datas importantes para receber um aviso no dia."
            actionLabel="Adicionar evento"
            actionIcon={<Plus size={20} color={tokens.colors.onPrimary} />}
            onAction={() => router.navigate('/(tabs)/events')}
          />
        )}
        <View style={styles.list}>
          {birthdays.map((item) => {
            const today = item.days_until === 0;
            const contents = (
              <View style={styles.eventContent}>
                <DsAvatar
                  name={item.title}
                  size={56}
                  photoUri={item.avatar_url}
                />
                <View style={styles.eventCopy}>
                  <View style={styles.eventTitle}>
                    <DsText role="label" style={{ flexShrink: 1 }}>
                      {item.title}
                    </DsText>
                    <DsDaysBadge
                      days={item.days_until}
                      nextYear={item.is_next_year}
                    />
                  </View>
                  <View style={styles.type}>
                    <Cake size={14} color={tokens.colors.brand} />
                    <DsText role="caption">Aniversário</DsText>
                  </View>
                  {today && (
                    <View style={styles.eventAction}>
                      <DsText role="caption" style={styles.link}>
                        Ver evento
                      </DsText>
                      <ChevronRight size={14} color={tokens.colors.primary} />
                    </View>
                  )}
                </View>
              </View>
            );
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Ver aniversário de ${item.title}, ${today ? 'hoje' : `em ${item.days_until} dias`}`}
                onPress={() =>
                  item.source.kind === 'group_birthday'
                    ? router.navigate({
                        pathname: '/(tabs)/birthday',
                        params: { userId: item.source.user_id },
                      })
                    : router.navigate({
                        pathname: '/(tabs)/events',
                        params: { eventId: item.id },
                      })
                }
                style={({ pressed }) => [
                  styles.event,
                  today && styles.today,
                  pressed && { opacity: 0.75 },
                ]}
              >
                {today ? (
                  <LinearGradient colors={tokens.celebration}>
                    {contents}
                  </LinearGradient>
                ) : (
                  contents
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.heading}>
          <DsText role="section" style={styles.headingText}>
            Meus grupos
          </DsText>
          {!!groups.data?.length && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver todos os grupos"
              onPress={allGroups}
              style={styles.all}
            >
              <DsText role="caption" style={styles.link}>
                Ver todos
              </DsText>
            </Pressable>
          )}
        </View>
        {groups.loading && (
          <ActivityIndicator
            accessibilityLabel="Carregando grupos"
            color={tokens.colors.brand}
          />
        )}
        {groups.error && (
          <>
            <DsFeedback tone="error" message={groups.error} />
            <DsButton
              variant="text"
              label="Tentar carregar grupos novamente"
              onPress={() => {
                void groups.reload();
              }}
            />
          </>
        )}
        {!groups.loading && !groups.error && !groups.data?.length && (
          <DsEmptyState
            compact
            illustration={
              <DsEmptyIcon>
                <Users size={26} color={tokens.colors.brand} />
              </DsEmptyIcon>
            }
            title="Comemore junto de quem importa"
            description="Crie um grupo e compartilhe aniversários com família, amigos ou colegas."
            actionLabel="Criar meu primeiro grupo"
            actionVariant="soft"
            actionIcon={<Plus size={20} color={tokens.colors.actionText} />}
            onAction={allGroups}
          />
        )}
        <View style={styles.list}>
          {homeGroups(groups.data ?? []).map((group) => (
            <DsRow
              key={group.id}
              title={group.name}
              subtitle={`${group.member_count} ${group.member_count === 1 ? 'membro' : 'membros'}`}
              leading={<GroupAvatar group={group} size={48} />}
              style={styles.group}
              onPress={() =>
                router.navigate({
                  pathname: '/(tabs)/groups',
                  params: { groupId: group.id },
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: tokens.tabBarClearance,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  greeting: { flex: 1, gap: 6 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headingText: { flex: 1 },
  all: { minHeight: 48, justifyContent: 'center', paddingLeft: 8 },
  link: { color: tokens.colors.actionText },
  list: { gap: 8, marginBottom: 24 },
  event: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.row,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    boxShadow: tokens.shadows.card,
  },
  today: { borderWidth: 0 },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    minHeight: 80,
  },
  eventCopy: { flex: 1, gap: 3 },
  eventTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  type: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: tokens.colors.surface,
    borderRadius: 12,
    marginTop: 4,
  },
  group: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    boxShadow: tokens.shadows.card,
  },
});
