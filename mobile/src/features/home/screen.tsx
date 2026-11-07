import { router } from 'expo-router';
import { Cake, ChevronRight, Users } from 'lucide-react-native';
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
  DsBadge,
  DsButton,
  DsCard,
  DsFeedback,
  DsRow,
  DsText,
  tokens,
} from '../../design-system';
import { useResource } from '../../data/hooks';
import { useSession } from '../../session/provider';
import type { Agenda } from '../dates/model';
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
  const refresh = () => {
    void Promise.all([profile.reload(), agenda.reload(), groups.reload()]);
  };
  const allGroups = () =>
    router.navigate({ pathname: '/(tabs)/groups', params: { overview: '1' } });
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={agenda.loading || groups.loading || profile.loading}
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
            style={styles.avatar}
          >
            <DsText role="section" style={{ color: tokens.colors.actionText }}>
              {name.charAt(0).toUpperCase()}
            </DsText>
          </Pressable>
        </View>
        <View style={styles.heading}>
          <DsText role="section" style={styles.headingText}>
            Próximos eventos
          </DsText>
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
          <DsCard>
            <DsText>Nenhum aniversário próximo.</DsText>
            <DsButton
              label="Ver eventos"
              variant="text"
              onPress={() => router.navigate('/(tabs)/events')}
            />
          </DsCard>
        )}
        <View style={styles.list}>
          {birthdays.map((item) => {
            const today = item.days_until === 0;
            const contents = (
              <View style={styles.eventContent}>
                <View style={styles.person}>
                  <DsText role="section" style={styles.link}>
                    {item.title.trim().charAt(0).toUpperCase()}
                  </DsText>
                </View>
                <View style={styles.eventCopy}>
                  <View style={styles.eventTitle}>
                    <DsText role="label" style={{ flexShrink: 1 }}>
                      {item.title}
                    </DsText>
                    <DsBadge
                      label={
                        today
                          ? 'Hoje 🎉'
                          : `Em ${item.days_until} ${item.days_until === 1 ? 'dia' : 'dias'}`
                      }
                      tone={today ? 'today' : 'neutral'}
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
                  router.navigate({
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
          <DsCard>
            <DsText>Você ainda não participa de grupos.</DsText>
            <DsButton
              label="Explorar grupos"
              variant="text"
              onPress={allGroups}
            />
          </DsCard>
        )}
        <View style={styles.list}>
          {homeGroups(groups.data ?? []).map((group, index) => (
            <DsRow
              key={group.id}
              title={group.name}
              subtitle={`${group.member_count} ${group.member_count === 1 ? 'membro' : 'membros'}`}
              leading={
                <View
                  style={[
                    styles.groupIcon,
                    {
                      backgroundColor:
                        index === 0
                          ? tokens.colors.familySurface
                          : tokens.colors.friendsSurface,
                    },
                  ]}
                >
                  <Users
                    size={24}
                    color={
                      index === 0 ? tokens.colors.family : tokens.colors.friends
                    }
                  />
                </View>
              }
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
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  greeting: { flex: 1, gap: 6 },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: tokens.colors.iconSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headingText: { flex: 1 },
  all: { minHeight: 48, justifyContent: 'center', paddingLeft: 8 },
  link: { color: tokens.colors.actionText },
  list: { gap: 6, marginBottom: 16 },
  event: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.row,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    boxShadow: tokens.shadows.card,
  },
  today: { borderColor: tokens.colors.outlineBorder },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    minHeight: 80,
  },
  person: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
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
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
