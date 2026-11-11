import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsAvatar,
  DsBackHeader,
  DsBadge,
  DsButton,
  DsFeedback,
  DsListCard,
  DsText,
  tokens,
} from '../../design-system';
import {
  useAuthenticatedApi,
  usePullRefresh,
  useResource,
} from '../../data/hooks';
import { availabilityLabel, reserveError, reserveRequest } from './member';
import type { MemberGiftItem, MemberList, ReserveAction } from './member';
import { birthdayCountdown, firstName, giftHost } from './model';
import { GiftThumb } from './gift-thumb';
import { ReserveDialog } from './reserve-dialog';

export function GiftMemberScreen() {
  const params = useLocalSearchParams<{
    userId?: string | string[];
    from?: string | string[];
  }>();
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;
  const list = useResource<MemberList>(
    userId ? `/api/v1/users/${encodeURIComponent(userId)}/gifts` : null,
  );
  const { request } = useAuthenticatedApi();
  const pull = usePullRefresh();
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
  const ownerName = data ? firstName(data.owner.name) : '';
  const countdown = data
    ? birthdayCountdown(
        data.owner.birth_day,
        data.owner.birth_month,
        new Date(),
      )
    : null;
  const subtitle = !countdown
    ? null
    : countdown.days === 0
      ? 'Aniversário hoje. Escolha um presente!'
      : countdown.days === 1
        ? 'Aniversário amanhã'
        : `Faltam ${countdown.days} dias para o aniversário`;

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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pull.refreshing}
            tintColor={tokens.colors.brand}
            colors={[tokens.colors.brand]}
            onRefresh={() => {
              pull.run(list.reload);
            }}
          />
        }
      >
        <DsBackHeader
          label={from === 'birthday' ? 'Aniversário' : 'Presentes'}
          onPress={() => {
            if (from === 'birthday' && userId)
              router.navigate({
                pathname: '/(tabs)/birthday',
                params: { userId },
              });
            else if (router.canGoBack()) router.back();
            else router.navigate('/(tabs)/gifts');
          }}
        />
        {list.loading && !data && (
          <ActivityIndicator
            accessibilityLabel="Carregando lista"
            color={tokens.colors.brand}
          />
        )}
        {list.error && (
          <View style={styles.stack}>
            <DsFeedback tone="error" message={list.error} />
            <DsText role="caption" style={styles.muted}>
              Você só vê listas de pessoas que estão em um grupo com você.
            </DsText>
            <DsButton
              label="Tentar novamente"
              variant="outline"
              onPress={() => {
                void list.reload();
              }}
            />
          </View>
        )}
        {data && (
          <>
            <View style={styles.owner}>
              <DsAvatar
                name={data.owner.name}
                size={64}
                photoUri={data.owner.avatar_url}
              />
              <View style={styles.ownerCopy}>
                <DsText accessibilityRole="header" role="title">
                  {`Lista de presentes de ${ownerName}`}
                </DsText>
                {subtitle && (
                  <DsText role="caption" style={styles.muted}>
                    {subtitle}
                  </DsText>
                )}
              </View>
            </View>
            <LinearGradient
              colors={tokens.celebration}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.note}
            >
              <DsText role="caption" style={styles.muted}>
                {`As reservas ficam em segredo: ${ownerName} não vê quem escolheu cada presente.`}
              </DsText>
            </LinearGradient>
            {error && !selected && <DsFeedback tone="error" message={error} />}
            {data.items.length === 0 && (
              <DsText style={styles.muted}>
                Esta lista ainda não tem presentes.
              </DsText>
            )}
            {data.items.map((item) => {
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
                  trailing={
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
          </>
        )}
      </ScrollView>
      {selected && (
        <ReserveDialog
          item={selected}
          ownerName={ownerName}
          ownerPhotoUri={data?.owner.avatar_url}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: tokens.tabBarClearance,
    gap: 14,
  },
  owner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ownerCopy: { flex: 1, minWidth: 0, gap: 2 },
  muted: { color: tokens.colors.textMuted },
  stack: { gap: 12 },
  note: { padding: 14, borderRadius: 16 },
});
