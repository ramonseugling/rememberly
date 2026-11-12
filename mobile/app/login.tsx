import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsBrandHeader,
  DsButton,
  DsFeedback,
  DsText,
  tokens,
} from '../src/design-system';
import { useSession } from '../src/session/provider';
import { authorizeGoogle } from '../src/features/auth/google-native';
import {
  AuthAction,
  AuthGoogleButton,
  AuthLink,
  LegalLinksText,
  styles,
} from '../src/features/auth/ui';

export default function LoginScreen() {
  const { state, controller } = useSession();
  const busy = state.status === 'restoring' || state.status === 'signing-in';
  useFocusEffect(
    useCallback(() => () => controller.clearMessage(), [controller]),
  );
  return (
    <LinearGradient colors={tokens.backgroundGradient} style={local.fill}>
      <SafeAreaView style={local.fill}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={local.content}
        >
          <DsBrandHeader />
          <View style={local.actions}>
            <View style={local.copy}>
              <DsText role="title" style={local.center}>
                Bem-vindo!
              </DsText>
              <DsText role="caption" style={[local.center, local.muted]}>
                Pequenas lembranças. Grandes conexões.
              </DsText>
            </View>
            {state.message && (
              <DsFeedback tone="error" message={state.message} />
            )}
            {state.status === 'unavailable' ? (
              <>
                <AuthAction
                  label="Tentar conexão novamente"
                  onPress={() => {
                    void controller.restore();
                  }}
                />
                <AuthLink
                  label="Sair da conta"
                  onPress={() => {
                    void controller.logout();
                  }}
                />
              </>
            ) : (
              <>
                <AuthGoogleButton
                  disabled={busy}
                  onPress={() => {
                    if (controller.getSnapshot().status === 'signed-out')
                      void controller.loginWithGoogle(authorizeGoogle);
                  }}
                />
                <DsButton
                  label="Entrar com e-mail e senha"
                  icon={<Mail size={20} color={tokens.colors.onPrimary} />}
                  disabled={busy}
                  onPress={() => router.push('/login-email')}
                  style={styles.action}
                />
                <View style={local.footer}>
                  <DsText style={styles.text}>Ainda não tem conta?</DsText>
                  <AuthLink
                    label="Criar conta"
                    onPress={() => router.push('/signup')}
                  />
                </View>
                {state.logoutUnconfirmed && (
                  <AuthLink
                    label="Tentar encerrar sessão novamente"
                    onPress={() => {
                      void controller.logout();
                    }}
                  />
                )}
              </>
            )}
          </View>
        </ScrollView>
        <View style={local.legal}>
          <LegalLinksText
            prefix="Ao entrar com Google, você concorda com os "
            style={styles.legalCentered}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const local = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  actions: { width: '100%', maxWidth: 448, gap: 14 },
  copy: { gap: 6, marginBottom: 6 },
  center: { textAlign: 'center' },
  muted: { color: tokens.colors.textMuted },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legal: { paddingHorizontal: 24, paddingBottom: 16 },
});
