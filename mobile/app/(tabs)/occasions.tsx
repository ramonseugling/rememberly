import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandButton } from '../../src/components/brand-button/brand-button';
import { Text } from '../../src/components/brand-text/brand-text';
import {
  ApiError,
  useAuthenticatedApi,
  useResource,
} from '../../src/data/hooks';
import {
  civilDateLabel,
  daysUntilLabel,
  occasionLabel,
  type Occasion,
} from '../../src/features/account/forms';
import { useSession } from '../../src/session/provider';
import { theme } from '../../src/theme';

type Catalog = { today: string; time_zone: string; items: Occasion[] };

export default function OccasionsScreen() {
  const { state } = useSession();
  return <OccasionsContent key={state.identity?.user.id ?? 'signed-out'} />;
}

function OccasionsContent() {
  const { request } = useAuthenticatedApi();
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
    const enabled = desiredEnabled ?? !(confirmed[item.key] ?? item.enabled);
    try {
      await request(
        `/api/v1/commemorative-dates/${encodeURIComponent(item.key)}`,
        { method: enabled ? 'PUT' : 'DELETE' },
      );
      if (!mounted.current) return;
      setConfirmed((current) => ({ ...current, [item.key]: enabled }));
      await reload();
    } catch (cause) {
      if (
        mounted.current &&
        (!(cause instanceof ApiError) ||
          !['stale', 'cancelled'].includes(cause.kind))
      ) {
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
            refreshing={loading}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            onRefresh={() => {
              if (!busy.current) void reload();
            }}
          />
        }
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.heading}>
            Datas comemorativas
          </Text>
          <Text style={styles.text}>
            Ative os lembretes que deseja receber com 7 dias de antecedência.
          </Text>
        </View>
        {loading && !data && (
          <ActivityIndicator
            accessibilityLabel="Carregando datas comemorativas"
            color={theme.colors.primary}
          />
        )}
        {error && (
          <View style={styles.feedback}>
            <Text accessibilityRole="alert" style={styles.text}>
              Não foi possível carregar as datas comemorativas. Tente novamente.
            </Text>
            <BrandButton
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
          <View style={styles.feedback}>
            <Text style={styles.text}>
              Nenhuma data comemorativa disponível no momento.
            </Text>
          </View>
        )}
        {data?.items.map((item) => {
          const enabled = confirmed[item.key] ?? item.enabled;
          const label = occasionLabel(item);
          const failed = failure?.key === item.key;
          return (
            <View key={item.key} style={styles.card}>
              <View style={styles.cardRow}>
                <Text accessible={false} style={styles.emoji}>
                  {item.emoji}
                </Text>
                <View style={styles.cardCopy}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={styles.text}>
                    {daysUntilLabel(item.days_until)} ·{' '}
                    {civilDateLabel(item.next_date)}
                  </Text>
                  {pending === item.key && (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={styles.saving}
                    >
                      Salvando…
                    </Text>
                  )}
                </View>
                <View style={styles.switchTarget}>
                  <Switch
                    accessibilityLabel={`${enabled ? 'Desativar' : 'Ativar'} lembrete para ${label}`}
                    accessibilityState={{
                      busy: pending === item.key,
                      disabled: pending !== null,
                    }}
                    value={enabled}
                    disabled={pending !== null}
                    onValueChange={(nextEnabled) =>
                      void toggle(item, nextEnabled)
                    }
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor="#ffffff"
                    ios_backgroundColor={theme.colors.border}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  />
                </View>
              </View>
              {failed && (
                <View style={styles.retry}>
                  <Text accessibilityRole="alert" style={styles.error}>
                    Não foi possível atualizar este lembrete. Tente novamente.
                  </Text>
                  <BrandButton
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  header: { gap: 4, marginBottom: 8 },
  heading: {
    fontSize: 30,
    lineHeight: 38,
    color: theme.colors.foreground,
    fontFamily: theme.fonts.headingBold,
  },
  label: {
    fontSize: 16,
    lineHeight: 20,
    color: theme.colors.foreground,
    fontFamily: theme.fonts.heading,
  },
  text: { fontSize: 14, color: theme.colors.muted, lineHeight: 20 },
  feedback: {
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
  },
  card: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  emoji: { fontSize: 30 },
  cardCopy: { flex: 1, minWidth: 0, gap: 2 },
  switchTarget: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saving: { color: theme.colors.muted, fontSize: 12, lineHeight: 16 },
  retry: { marginTop: 12, gap: 12 },
  error: { color: theme.colors.destructive, fontSize: 14, lineHeight: 20 },
});
