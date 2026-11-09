import { router, useLocalSearchParams } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthenticatedApi } from '../src/data/hooks';
import {
  DsBrandHeader,
  DsButton,
  DsEmptyIcon,
  DsFeedback,
  DsText,
  tokens,
} from '../src/design-system';
import { PublicAuthError } from '../src/features/auth/api';
import { publicAuth, useAuthTask } from '../src/features/auth/ui';
import { useIntents } from '../src/navigation/provider';
import { inviteCode, resourceId } from '../src/navigation/intents';
import { useSession } from '../src/session/provider';

type Preview =
  | { kind: 'loading' }
  | { kind: 'ready'; name: string }
  | { kind: 'unknown' }
  | { kind: 'invalid' };

export default function JoinGroupScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const code = inviteCode(params.code) ? params.code : null;
  const { state, controller } = useSession();
  const { request } = useAuthenticatedApi();
  const { enqueue, clear } = useIntents();
  const task = useAuthTask();
  const authenticated = state.status === 'authenticated';
  const [preview, setPreview] = useState<Preview>(
    code ? { kind: 'loading' } : { kind: 'invalid' },
  );

  useEffect(() => {
    if (!code || typeof code !== 'string') {
      setPreview({ kind: 'invalid' });
      return;
    }
    const abort = new AbortController();
    setPreview({ kind: 'loading' });
    publicAuth
      .invitePreview(code, abort.signal)
      .then(({ name }) => {
        if (!abort.signal.aborted) setPreview({ kind: 'ready', name });
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        const notFound =
          error instanceof PublicAuthError &&
          (error.status === 404 || error.status === 400);
        setPreview({ kind: notFound ? 'invalid' : 'unknown' });
      });
    return () => abort.abort();
  }, [code]);

  const valid = !!code && preview.kind !== 'invalid';
  const title =
    preview.kind === 'ready'
      ? `Convite para o grupo ${preview.name}`
      : valid
        ? 'Convite para um grupo'
        : 'Convite inválido';
  const description = !valid
    ? 'Este link de convite é inválido ou o grupo não existe mais. Peça um novo convite a quem administra o grupo.'
    : authenticated
      ? 'Você foi convidado para um grupo do Rememberly. Ao entrar, seu perfil e seu aniversário serão compartilhados com os membros. Confirme para entrar com a conta em que você está conectado.'
      : 'Você foi convidado para um grupo do Rememberly. Entre ou crie sua conta para aceitar. O convite fica guardado até você terminar.';
  const busy = task.pending || preview.kind === 'loading';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <DsBrandHeader />
        <View style={styles.card}>
          <DsEmptyIcon size={56} gradient>
            <UserPlus size={26} color={tokens.colors.onPrimary} />
          </DsEmptyIcon>
          <View style={styles.copy}>
            <DsText role="title" style={styles.center}>
              {title}
            </DsText>
            <DsText style={[styles.center, styles.muted]}>{description}</DsText>
          </View>
          {task.message && <DsFeedback tone="error" message={task.message} />}
          {valid &&
            code &&
            (authenticated ? (
              <DsButton
                label="Confirmar e entrar no grupo"
                disabled={busy}
                pending={task.pending}
                style={styles.primary}
                onPress={() => {
                  const owner = state.identity?.user.id;
                  void task.run(async (signal) => {
                    const group = await request<{ id: string }>(
                      '/api/v1/groups/join',
                      { method: 'POST', body: { invite_code: code }, signal },
                    );
                    if (
                      signal.aborted ||
                      controller.getSnapshot().identity?.user.id !== owner
                    )
                      return;
                    if (!resourceId(group.id))
                      throw new Error(
                        'A resposta do grupo foi inválida. Abra Grupos para conferir sua participação.',
                      );
                    clear();
                    router.replace({
                      pathname: '/(tabs)/groups',
                      params: { groupId: group.id },
                    });
                  });
                }}
              />
            ) : (
              <>
                <DsButton
                  label="Entrar para continuar"
                  disabled={busy || state.status === 'restoring'}
                  style={styles.primary}
                  onPress={() => {
                    enqueue({ kind: 'invitation', code });
                    router.push('/login');
                  }}
                />
                <DsButton
                  label="Criar uma conta"
                  variant="outline"
                  disabled={busy || state.status === 'restoring'}
                  style={styles.primary}
                  onPress={() => {
                    enqueue({ kind: 'invitation', code });
                    router.push('/signup');
                  }}
                />
              </>
            ))}
          <DsButton
            label={valid ? 'Recusar convite' : 'Voltar ao início'}
            variant="text"
            disabled={task.pending}
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
