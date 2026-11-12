import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Users } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsAvatar,
  DsBadge,
  DsChip,
  DsFeedback,
  DsListCard,
  DsSheet,
  DsText,
  tokens,
} from '../../design-system';
import { useAuthenticatedApi, useResource } from '../../data/hooks';
import { ConfettiLayer } from './confetti';
import type { ConfettiPiece } from './confetti';
import { availabilityLabel, reserveError, reserveRequest } from './member';
import type { MemberGiftItem, MemberList, ReserveAction } from './member';
import { birthdayCard, firstName, giftHost } from './model';
import { birthdayHeadline, groupsLabel } from './birthday-copy';
import { originPath, parseOrigin } from './birthday-route';
import { BirthdayHat } from './birthday-hat';
import { GiftThumb } from './gift-thumb';
import { ReserveDialog } from './reserve-dialog';

const WIDTH = 390;

const confetti: readonly ConfettiPiece[] = [
  { left: 30, top: 120, w: 10, h: 5, rotate: 20, color: '#F7A8C4' },
  { left: 70, top: 70, w: 6, h: 6, rotate: 0, color: '#FEC8A0' },
  { left: 330, top: 90, w: 10, h: 5, rotate: -30, color: '#F58FB0' },
  { left: 350, top: 160, w: 6, h: 6, rotate: 0, color: '#FDB87C' },
  { left: 300, top: 60, w: 6, h: 6, rotate: 0, color: '#F7A8C4' },
  { left: 40, top: 200, w: 8, h: 4, rotate: 40, color: '#FDB87C' },
  { left: 320, top: 210, w: 10, h: 5, rotate: 15, color: '#F7A8C4' },
  { left: 110, top: 40, w: 8, h: 4, rotate: -20, color: '#F58FB0' },
  { left: 260, top: 36, w: 6, h: 6, rotate: 0, color: '#FEC8A0' },
  { left: 20, top: 60, w: 6, h: 6, rotate: 0, color: '#F58FB0' },
];

export function BirthdayScreen() {
  const params = useLocalSearchParams<{
    userId?: string | string[];
    from?: string | string[];
  }>();
  const origin = parseOrigin(params.from);
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;
  const list = useResource<MemberList>(
    userId ? `/api/v1/users/${encodeURIComponent(userId)}/gifts` : null,
  );
  const { request } = useAuthenticatedApi();
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const data = list.data;
  const selected: MemberGiftItem | null =
    data?.items.find((item) => item.id === selectedId) ?? null;
  const name = data ? firstName(data.owner.name) : '';
  const card = data
    ? birthdayCard(
        data.owner.birth_day,
        data.owner.birth_month,
        data.owner.birth_year,
        new Date(),
      )
    : null;
  const today = card?.days === 0;
  const items = data?.items ?? [];

  async function run(item: MemberGiftItem, action: ReserveAction) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    const { path, method, body } = reserveRequest(item.id, action);
    try {
      await request(path, { method, body });
      if (!mounted.current) return;
      setSelectedId(null);
      await list.reload();
    } catch (caught) {
      if (!mounted.current) return;
      setError(reserveError(caught));
      await list.reload();
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return (
    <LinearGradient
      colors={['#FEE6E8', '#FCF4F8', '#FDF9FB']}
      locations={[0, 0.38, 1]}
      style={styles.fill}
    >
      <ConfettiLayer pieces={confetti} width={WIDTH} opacity={0.85} />
      <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.navigate(originPath(origin))}
            style={styles.back}
          >
            <ChevronLeft size={22} color={tokens.colors.text} />
          </Pressable>
          {list.loading && !data && (
            <ActivityIndicator
              accessibilityLabel="Carregando"
              color={tokens.colors.brand}
            />
          )}
          {list.error && (
            <View style={styles.stack}>
              <DsFeedback tone="error" message={list.error} />
              <DsText role="caption" style={styles.muted}>
                Você só vê pessoas que estão em um grupo com você.
              </DsText>
            </View>
          )}
          {data && (
            <>
              <View style={[styles.hero, today && styles.heroToday]}>
                <View style={styles.photo}>
                  <DsAvatar
                    name={data.owner.name}
                    size={104}
                    photoUri={data.owner.avatar_url}
                  />
                  {today && (
                    <View style={styles.crown}>
                      <BirthdayHat />
                    </View>
                  )}
                </View>
                <DsText role="title" style={styles.title}>
                  {birthdayHeadline(name, card?.days ?? null)}
                </DsText>
                {card && (
                  <View style={styles.meta}>
                    <DsText style={styles.muted}>
                      {card.age
                        ? `${card.dateLabel} · ${card.age} anos`
                        : card.dateLabel}
                    </DsText>
                    <DsBadge
                      label={
                        today
                          ? 'Hoje'
                          : card.days === 1
                            ? 'Em 1 dia'
                            : `Em ${card.days} dias`
                      }
                      tone={today ? 'today' : 'soon'}
                    />
                  </View>
                )}
                {data.groups.length > 0 && (
                  <DsChip
                    label={groupsLabel(data.groups)}
                    icon={<Users size={14} color={tokens.colors.textMuted} />}
                    style={styles.groupsChip}
                    onPress={() => setGroupsOpen(true)}
                  />
                )}
              </View>
              <View style={styles.giftCard}>
                <View>
                  <DsText role="section">{`Lista de presentes de ${name} 🎁`}</DsText>
                  <DsText role="caption" style={styles.muted}>
                    {items.length === 0
                      ? `${name} ainda não adicionou presentes.`
                      : today
                        ? 'Ideias para surpreender neste dia especial.'
                        : 'Reserve um presente com antecedência.'}
                  </DsText>
                </View>
                {error && !selected && (
                  <DsFeedback tone="error" message={error} />
                )}
                {items.map((item) => {
                  const label = availabilityLabel(item);
                  return (
                    <DsListCard
                      key={item.id}
                      title={item.title}
                      subtitle={
                        item.description ??
                        (item.link ? giftHost(item.link) : undefined)
                      }
                      icon={<GiftThumb uri={item.photo_url} size={44} />}
                      footer={
                        label ? (
                          <DsBadge
                            label={label}
                            tone={
                              item.availability === 'purchased'
                                ? 'success'
                                : 'neutral'
                            }
                          />
                        ) : undefined
                      }
                      onPress={() => {
                        setError(null);
                        setSelectedId(item.id);
                      }}
                    />
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
        {selected && data && (
          <ReserveDialog
            item={selected}
            ownerName={name}
            ownerPhotoUri={data.owner.avatar_url}
            pending={pending}
            error={error}
            onAction={(action) => {
              void run(selected, action);
            }}
            onClose={() => {
              if (!busy.current) setSelectedId(null);
            }}
          />
        )}
        {data && (
          <DsSheet
            visible={groupsOpen}
            title={`Grupos de ${name}`}
            onClose={() => setGroupsOpen(false)}
          >
            <DsText role="caption" style={styles.muted}>
              {`Grupos que você e ${name} têm em comum.`}
            </DsText>
            <View style={styles.groupList}>
              {data.groups.map((group) => (
                <View key={group} style={styles.groupRow}>
                  <View style={styles.groupIcon}>
                    <Users size={20} color={tokens.colors.brand} />
                  </View>
                  <DsText role="label" style={styles.groupName}>
                    {group}
                  </DsText>
                </View>
              ))}
            </View>
          </DsSheet>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: tokens.tabBarClearance,
    gap: 16,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  stack: { gap: 12 },
  muted: { color: tokens.colors.textMuted },
  hero: { alignItems: 'center', gap: 8, paddingTop: 4 },
  heroToday: { paddingTop: 30 },
  groupsChip: { alignSelf: 'center' },
  groupList: { gap: 8, marginTop: 12 },
  groupRow: {
    minHeight: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.iconSurface,
  },
  groupName: { flex: 1, minWidth: 0 },
  photo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 10px 28px rgba(229, 53, 101, 0.22)',
  },
  crown: {
    position: 'absolute',
    right: 13,
    top: -38,
    transform: [{ rotate: '20deg' }],
  },
  title: { textAlign: 'center', marginTop: 6 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  giftCard: {
    padding: 16,
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: '0 8px 24px rgba(108, 39, 77, 0.10)',
  },
});
