import { router } from 'expo-router';
import { LogOut, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResource } from '../../src/data/hooks';
import {
  DsBackHeader,
  DsButton,
  DsFeedback,
  DsText,
  tokens,
} from '../../src/design-system';
import type { ProfileUser } from '../../src/features/account/forms';
import { DeleteAccountSheet } from '../../src/features/account/delete-account';
import { useSession } from '../../src/session/provider';

export default function AccountScreen() {
  const { state } = useSession();
  return <AccountContent key={state.identity?.user.id ?? 'signed-out'} />;
}

function AccountContent() {
  const { controller, state } = useSession();
  const profile = useResource<{ user: ProfileUser }>('/api/v1/mobile/me');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const signingOut = useRef(false);

  async function logout() {
    if (signingOut.current) return;
    signingOut.current = true;
    setLoggingOut(true);
    try {
      await controller.logout();
    } finally {
      signingOut.current = false;
      setLoggingOut(false);
    }
  }

  const user = profile.data?.user;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <DsBackHeader
          label="Perfil"
          onPress={() => router.navigate('/(tabs)/profile')}
        />
        <View style={styles.header}>
          <DsText role="title">Mais opções da conta</DsText>
          <DsText role="caption" style={styles.muted}>
            Gerencie os dados da sua conta.
          </DsText>
        </View>
        {state.message && <DsFeedback tone="error" message={state.message} />}
        <View style={styles.card}>
          <View style={styles.copy}>
            <DsText role="section" style={styles.cardTitle}>
              Sair da conta
            </DsText>
            <DsText role="caption" style={styles.muted}>
              Encerra a sessão neste aparelho.
            </DsText>
          </View>
          <DsButton
            label={loggingOut ? 'Saindo...' : 'Sair da conta'}
            variant="soft"
            pending={loggingOut}
            icon={<LogOut size={20} color={tokens.colors.actionText} />}
            onPress={() => {
              void logout();
            }}
          />
        </View>
        <View style={styles.danger}>
          <View style={styles.copy}>
            <DsText
              role="section"
              style={[styles.cardTitle, { color: tokens.colors.danger }]}
            >
              Excluir conta
            </DsText>
            <DsText role="caption" style={styles.muted}>
              Exclua permanentemente sua conta, seus dados pessoais e suas
              participações em grupos. Esta ação não pode ser desfeita.
            </DsText>
          </View>
          {profile.loading && !user && (
            <ActivityIndicator
              accessibilityLabel="Carregando conta"
              color={tokens.colors.brand}
            />
          )}
          {profile.error && <DsFeedback tone="error" message={profile.error} />}
          <DsButton
            label="Excluir conta"
            variant="destructive"
            icon={<Trash2 size={18} color={tokens.colors.danger} />}
            disabled={!user || loggingOut}
            onPress={() => setDeleteOpen(true)}
          />
        </View>
      </ScrollView>
      {user && (
        <DeleteAccountSheet
          visible={deleteOpen}
          hasPassword={user.has_password ?? false}
          email={user.email}
          onClose={() => setDeleteOpen(false)}
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
    paddingBottom: 32,
    gap: 16,
  },
  header: { gap: 6 },
  muted: { color: tokens.colors.textMuted },
  card: {
    padding: 16,
    gap: 12,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  danger: {
    padding: 16,
    gap: 12,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.colors.dangerSurface,
  },
  copy: { gap: 2 },
  cardTitle: { fontSize: 18, lineHeight: 24 },
});
