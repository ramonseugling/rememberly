import { router } from 'expo-router';
import { Gift } from 'lucide-react-native';
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
  DsButton,
  DsEmptyIcon,
  DsEmptyState,
  DsFeedback,
  DsListCard,
  DsText,
  tokens,
} from '../../design-system';
import { useResource } from '../../data/hooks';
import type { VisibleOwners } from './member';

export function GiftGroupsScreen() {
  const visible = useResource<VisibleOwners>('/api/v1/gifts/visible');
  const owners = visible.data?.owners ?? [];
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={visible.loading}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
            onRefresh={() => {
              void visible.reload();
            }}
          />
        }
      >
        <DsBackHeader
          label="Presentes"
          onPress={() => router.navigate('/(tabs)/gifts')}
        />
        <View style={styles.header}>
          <DsText accessibilityRole="header" role="title">
            Listas dos grupos
          </DsText>
          <DsText role="caption" style={styles.muted}>
            Veja o que as pessoas dos seus grupos gostariam de ganhar.
          </DsText>
        </View>
        {visible.loading && !visible.data && (
          <ActivityIndicator
            accessibilityLabel="Carregando listas"
            color={tokens.colors.primary}
          />
        )}
        {visible.error && (
          <View style={styles.stack}>
            <DsFeedback tone="error" message={visible.error} />
            <DsButton
              label="Tentar novamente"
              variant="outline"
              onPress={() => {
                void visible.reload();
              }}
            />
          </View>
        )}
        {visible.data && owners.length === 0 && (
          <DsEmptyState
            illustration={
              <DsEmptyIcon size={72} gradient>
                <Gift size={32} color={tokens.colors.onPrimary} />
              </DsEmptyIcon>
            }
            title="Nenhuma lista compartilhada"
            description="Quando alguém dos seus grupos compartilhar uma lista de presentes, ela aparece aqui."
          />
        )}
        {owners.map((owner) => (
          <DsListCard
            key={owner.user_id}
            title={owner.name}
            subtitle={
              owner.item_count === 1
                ? '1 presente'
                : `${owner.item_count} presentes`
            }
            icon={
              <DsAvatar
                name={owner.name}
                size={36}
                photoUri={owner.avatar_url}
              />
            }
            onPress={() =>
              router.navigate({
                pathname: '/(tabs)/gifts-member',
                params: { userId: owner.user_id },
              })
            }
          />
        ))}
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
  stack: { gap: 12 },
});
