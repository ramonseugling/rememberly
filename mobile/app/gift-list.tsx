import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Gift } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsBrandHeader,
  DsButton,
  DsEmptyIcon,
  DsText,
  tokens,
} from '../src/design-system';
import { useIntents } from '../src/navigation/provider';
import { listCode, resourceId } from '../src/navigation/intents';
import { useSession } from '../src/session/provider';

export default function GiftListLinkScreen() {
  const params = useLocalSearchParams<{
    user?: string | string[];
    list?: string | string[];
  }>();
  const user = Array.isArray(params.user) ? params.user[0] : params.user;
  const userId = resourceId(user) ? user : null;
  const rawCode = Array.isArray(params.list) ? params.list[0] : params.list;
  const code = listCode(rawCode) ? rawCode : null;
  const valid = !!userId || !!code;
  const pendingIntent = code
    ? ({ kind: 'gift-list-code', code } as const)
    : userId
      ? ({ kind: 'gift-list', userId } as const)
      : null;
  const { state } = useSession();
  const { enqueue, clear } = useIntents();

  if (valid && state.status === 'authenticated')
    return (
      <Redirect
        href={{
          pathname: '/(tabs)/birthday',
          params: code ? { list: code } : { userId: userId! },
        }}
      />
    );

  const restoring = state.status === 'restoring';
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <DsBrandHeader />
        <View style={styles.card}>
          <DsEmptyIcon size={56} gradient>
            <Gift size={26} color={tokens.colors.onPrimary} />
          </DsEmptyIcon>
          <View style={styles.copy}>
            <DsText role="title" style={styles.center}>
              {valid ? 'Lista de presentes' : 'Link inválido'}
            </DsText>
            <DsText style={[styles.center, styles.muted]}>
              {valid
                ? 'Entre ou crie sua conta para ver a lista e reservar um presente. O link fica guardado até você terminar.'
                : 'Este link de lista de presentes é inválido. Peça um novo link a quem compartilhou.'}
            </DsText>
          </View>
          {valid && pendingIntent && (
            <>
              <DsButton
                label="Entrar para continuar"
                disabled={restoring}
                style={styles.primary}
                onPress={() => {
                  enqueue(pendingIntent);
                  router.push('/login');
                }}
              />
              <DsButton
                label="Criar uma conta"
                variant="outline"
                disabled={restoring}
                style={styles.primary}
                onPress={() => {
                  enqueue(pendingIntent);
                  router.push('/signup');
                }}
              />
            </>
          )}
          <DsButton
            label="Voltar ao início"
            variant="text"
            onPress={() => {
              clear();
              router.replace('/');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 24,
  },
  card: {
    padding: 20,
    paddingVertical: 24,
    gap: 16,
    borderRadius: tokens.radius.sheet,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  copy: { gap: 8 },
  center: { textAlign: 'center' },
  muted: { color: tokens.colors.textMuted },
  primary: { minHeight: 52 },
});
