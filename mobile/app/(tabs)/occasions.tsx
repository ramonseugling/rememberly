import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
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
  ApiError,
  useAuthenticatedApi,
  usePullRefresh,
  useResource,
} from '../../src/data/hooks';
import {
  DsBackHeader,
  DsButton,
  DsFeedback,
  DsListCard,
  DsText,
  DsToggle,
  tokens,
} from '../../src/design-system';
import {
  civilDateLabel,
  daysUntilLabel,
  occasionLabel,
  type Occasion,
} from '../../src/features/account/forms';
import { useSession } from '../../src/session/provider';

type Catalog = { today: string; time_zone: string; items: Occasion[] };

export default function OccasionsScreen() {
  const { state } = useSession();
  return <OccasionsContent key={state.identity?.user.id ?? 'signed-out'} />;
}

function OccasionsContent() {
  const { request } = useAuthenticatedApi();
  const pull = usePullRefresh();
  const { data, loading, error, reload } = useResource<Catalog>(
    '/api/v1/mobile/commemorative-dates',
  );
  const busy = useRef(false);
  const mounted = useRef(true);
  const [pending, setPending] = useState<string | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    enabled: boolean;
  } | null>(null);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (data) setConfirmed({});
  }, [data]);

  async function toggle(item: Occasion, desiredEnabled?: boolean) {
    if (!mounted.current || busy.current) return;
    busy.current = true;
    setPending(item.key);
    setFailure(null);
    const previous = confirmed[item.key] ?? item.enabled;
    const enabled = desiredEnabled ?? !previous;
    setConfirmed((current) => ({ ...current, [item.key]: enabled }));
    try {
      await request(
        `/api/v1/commemorative-dates/${encodeURIComponent(item.key)}`,
        { method: enabled ? 'PUT' : 'DELETE' },
      );
      if (!mounted.current) return;
      await reload();
    } catch (cause) {
      if (
        mounted.current &&
        (!(cause instanceof ApiError) ||
          !['stale', 'cancelled'].includes(cause.kind))
      ) {
        setConfirmed((current) => ({ ...current, [item.key]: previous }));
        setFailure({ key: item.key, enabled });
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(null);
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
              if (!busy.current) pull.run(reload);
            }}
          />
        }
      >
        <DsBackHeader
          label="Perfil"
          onPress={() => router.navigate('/(tabs)/profile')}
        />
        <View style={styles.header}>
          <DsText role="title">Datas especiais</DsText>
          <DsText role="caption" style={styles.muted}>
            Ative para não esquecer de comprar um presente. Avisamos 7 dias
            antes de cada evento.
          </DsText>
        </View>
        {loading && !data && (
          <ActivityIndicator
            accessibilityLabel="Carregando datas especiais"
            color={tokens.colors.brand}
          />
        )}
        {error && (
          <View style={styles.feedback}>
            <DsFeedback
              tone="error"
              message="Não foi possível carregar as datas especiais. Tente novamente."
            />
            <DsButton
              label="Tentar novamente"
              variant="outline"
              disabled={pending !== null}
              onPress={() => {
                if (!busy.current) void reload();
              }}
            />
          </View>
        )}
        {data?.items.length === 0 && (
          <DsText style={styles.muted}>
            Nenhuma data especial disponível no momento.
          </DsText>
        )}
        {data?.items.map((item) => {
          const enabled = confirmed[item.key] ?? item.enabled;
          const label = occasionLabel(item);
          const failed = failure?.key === item.key;
          return (
            <View key={item.key} style={styles.item}>
              <DsListCard
                title={label}
                subtitle={`${daysUntilLabel(item.days_until)} · ${civilDateLabel(item.next_date)}`}
                icon={
                  <DsText accessible={false} style={styles.emoji}>
                    {item.emoji}
                  </DsText>
                }
                trailing={
                  <DsToggle
                    accessibilityLabel={`${enabled ? 'Desativar' : 'Ativar'} lembrete para ${label}`}
                    accessibilityState={{ busy: pending === item.key }}
                    value={enabled}
                    onValueChange={(next) => void toggle(item, next)}
                  />
                }
              />
              {failed && (
                <View style={styles.retry}>
                  <DsFeedback
                    tone="error"
                    message="Não foi possível atualizar este lembrete. Tente novamente."
                  />
                  <DsButton
                    label="Tentar novamente"
                    variant="outline"
                    disabled={pending !== null}
                    onPress={() => void toggle(item, failure.enabled)}
                  />
                </View>
              )}
            </View>
          );
        })}
        <LinearGradient colors={tokens.celebration} style={styles.banner}>
          <View style={styles.bannerCopy}>
            <DsText role="section" style={styles.bannerTitle}>
              Faltou algum evento?
            </DsText>
            <DsText role="caption" style={styles.muted}>
              Crie nos seus eventos!
            </DsText>
          </View>
          <DsButton
            label="Adicionar evento"
            icon={<Plus size={20} color={tokens.colors.onPrimary} />}
            onPress={() => router.navigate('/(tabs)/events')}
          />
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: tokens.tabBarClearance,
    gap: 12,
  },
  header: { gap: 6, marginBottom: 4 },
  muted: { color: tokens.colors.textMuted },
  feedback: { gap: 12 },
  item: { gap: 8 },
  emoji: { fontSize: 24, lineHeight: 30 },
  retry: { gap: 8 },
  banner: {
    marginTop: 4,
    padding: 16,
    paddingVertical: 18,
    gap: 12,
    borderRadius: tokens.radius.card,
    boxShadow: tokens.shadows.card,
  },
  bannerCopy: { gap: 2 },
  bannerTitle: { fontSize: 18, lineHeight: 24 },
});
