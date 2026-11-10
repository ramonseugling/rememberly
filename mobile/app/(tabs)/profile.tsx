import { useState } from 'react';
import { router } from 'expo-router';
import {
  Bell,
  CalendarHeart,
  ScrollText,
  Settings2,
  UserRound,
} from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsAvatar,
  DsButton,
  DsCard,
  DsFeedback,
  DsListCard,
  DsText,
  tokens,
} from '../../src/design-system';
import { isDesignCatalogEnabled } from '../../src/design-system/availability';
import { apiConfiguration } from '../../src/config/environment';
import { useResource } from '../../src/data/hooks';
import type { ProfileUser } from '../../src/features/account/forms';
import { useSession } from '../../src/session/provider';
import { PhotoSheet } from '../../src/features/photo/photo-sheet';
import { usePhotoUpload } from '../../src/features/photo/use-photo-upload';

export default function ProfileScreen() {
  const { state } = useSession();
  return <ProfileContent key={state.identity?.user.id ?? 'signed-out'} />;
}

function ProfileContent() {
  const { state } = useSession();
  const { data, loading, error, reload } = useResource<{ user: ProfileUser }>(
    '/api/v1/mobile/me',
  );
  const [photoOpen, setPhotoOpen] = useState(false);
  const photo = usePhotoUpload('/api/v1/users/avatar', reload);
  const user = data?.user;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <DsText role="title" accessibilityRole="header">
            Meu perfil
          </DsText>
          <DsText role="caption" style={styles.muted}>
            Sua foto, seus dados e as configurações da conta.
          </DsText>
        </View>
        {loading && !data && (
          <ActivityIndicator
            accessibilityLabel="Carregando perfil"
            color={tokens.colors.primary}
          />
        )}
        {error && (
          <DsCard>
            <DsFeedback message={error} tone="error" />
            <DsButton
              label="Tentar novamente"
              variant="outline"
              onPress={() => {
                void reload();
              }}
            />
          </DsCard>
        )}
        {user && (
          <View style={styles.identity}>
            <DsAvatar
              name={user.name}
              size={80}
              photoUri={user.avatar_url}
              onEdit={() => setPhotoOpen(true)}
              editLabel="Editar foto de perfil"
            />
            <View style={styles.identityText}>
              <DsText role="section" style={styles.identityName}>
                {user.name}
              </DsText>
              <DsText selectable role="caption" style={styles.email}>
                {user.email}
              </DsText>
            </View>
          </View>
        )}
        {state.message && <DsFeedback message={state.message} tone="error" />}
        <DsListCard
          title="Informações pessoais"
          subtitle="Seu nome e a data do seu aniversário"
          icon={<UserRound size={22} color={tokens.colors.brand} />}
          onPress={() => router.navigate('/(tabs)/personal')}
        />
        <DsListCard
          title="Datas especiais"
          subtitle="Seus lembretes de Dia das Mães, dia dos Pais e mais..."
          icon={<CalendarHeart size={22} color={tokens.colors.brand} />}
          onPress={() => router.navigate('/(tabs)/occasions')}
        />
        <DsListCard
          title="Notificações"
          subtitle="Push e e-mail: escolha como ser avisado"
          icon={<Bell size={22} color={tokens.colors.brand} />}
          onPress={() => router.navigate('/(tabs)/notifications')}
        />
        <DsListCard
          title="Termos e privacidade"
          subtitle="Termos de uso e política de privacidade"
          icon={<ScrollText size={22} color={tokens.colors.brand} />}
          onPress={() => router.navigate('/(tabs)/legal')}
        />
        <DsListCard
          title="Mais opções da conta"
          subtitle="Sair da conta e outras opções"
          icon={<Settings2 size={22} color={tokens.colors.textMuted} />}
          iconTone="neutral"
          onPress={() => router.navigate('/(tabs)/account')}
        />
        {isDesignCatalogEnabled(apiConfiguration.environment, __DEV__) && (
          <DsButton
            label="Catálogo do design system"
            variant="text"
            onPress={() => router.push('/design-system')}
          />
        )}
      </ScrollView>
      <PhotoSheet
        visible={photoOpen}
        title="Foto de perfil"
        name={user?.name ?? ''}
        photoUri={user?.avatar_url ?? null}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: tokens.tabBarClearance,
    gap: 16,
  },
  intro: { gap: 4 },
  muted: { color: tokens.colors.textMuted },
  identity: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  identityText: { alignItems: 'center', gap: 4, width: '100%' },
  identityName: { textAlign: 'center' },
  email: { textAlign: 'center', color: tokens.colors.textMuted },
});
