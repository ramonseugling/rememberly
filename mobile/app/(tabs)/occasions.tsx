import { Text } from '../../src/components/brand-text/brand-text';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthenticatedApi, useResource } from '../../src/data/hooks';
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
  const [pending, setPending] = useState<string | null>(null);
  const [failure, setFailure] = useState<{
    item: Occasion;
    message: string;
  } | null>(null);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (data) setConfirmed({});
  }, [data]);

  async function toggle(item: Occasion) {
    if (pending) return;
    setPending(item.key);
    setFailure(null);
    const enabled = confirmed[item.key] ?? item.enabled;
    try {
      await request(
        `/api/v1/commemorative-dates/${encodeURIComponent(item.key)}`,
        { method: enabled ? 'DELETE' : 'PUT' },
      );
      setConfirmed((current) => ({ ...current, [item.key]: !enabled }));
      await reload();
    } catch (cause) {
      setFailure({
        item,
        message:
          cause instanceof Error
            ? cause.message
            : 'Unable to update this preference. Try again.',
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.heading}>
          Datas comemorativas
        </Text>
        <Text style={styles.text}>
          Choose the occasions you want to remember. Dates follow the Brazilian
          calendar.
        </Text>
        <Text style={styles.hint}>
          These are account reminder preferences. Push notifications are not
          available in this app yet.
        </Text>
        {loading && (
          <ActivityIndicator accessibilityLabel="Loading occasions" />
        )}
        {error && (
          <View style={styles.section}>
            <Text accessibilityRole="alert" style={styles.text}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.button}
              onPress={() => void reload()}
            >
              <Text style={styles.buttonText}>Retry loading occasions</Text>
            </Pressable>
          </View>
        )}
        {failure && (
          <View style={styles.section}>
            <Text accessibilityRole="alert" style={styles.text}>
              {failure.message}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={pending !== null}
              style={styles.button}
              onPress={() => void toggle(failure.item)}
            >
              <Text style={styles.buttonText}>
                Retry {occasionLabel(failure.item)}
              </Text>
            </Pressable>
          </View>
        )}
        {data?.items.length === 0 && (
          <Text style={styles.text}>
            No special occasions are available right now.
          </Text>
        )}
        {data?.items.map((item) => (
          <View key={item.key} style={styles.card}>
            <Text accessibilityRole="header" style={styles.label}>
              {item.emoji} {occasionLabel(item)}
            </Text>
            <Text style={styles.text}>
              {civilDateLabel(item.next_date)} ·{' '}
              {daysUntilLabel(item.days_until)}
            </Text>
            <View style={styles.toggle}>
              <Text style={styles.text}>
                {pending === item.key
                  ? 'Saving…'
                  : (confirmed[item.key] ?? item.enabled)
                    ? 'Reminder enabled'
                    : 'Reminder disabled'}
              </Text>
              <Switch
                accessibilityLabel={`Reminder for ${occasionLabel(item)}`}
                accessibilityState={{ busy: pending === item.key }}
                value={confirmed[item.key] ?? item.enabled}
                disabled={pending !== null}
                onValueChange={() => void toggle(item)}
                trackColor={{ true: theme.colors.primary }}
              />
            </View>
          </View>
        ))}
        {data && (
          <Text style={styles.hint}>Calendar time zone: {data.time_zone}.</Text>
        )}
        <Pressable
          accessibilityRole="button"
          disabled={loading || pending !== null}
          onPress={() => void reload()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Refresh</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 20 },
  section: { gap: 12 },
  heading: { fontSize: 32, color: theme.colors.foreground, fontWeight: '700' },
  label: { fontSize: 21, color: theme.colors.foreground, fontWeight: '600' },
  text: { fontSize: 17, color: theme.colors.muted, lineHeight: 26 },
  hint: { fontSize: 15, color: theme.colors.muted, lineHeight: 23 },
  card: {
    backgroundColor: theme.colors.card,
    padding: 20,
    gap: 12,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
