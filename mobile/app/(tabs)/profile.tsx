import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronUp, LogOut } from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsText,
  DsButton,
  DsField,
  DsCard,
  DsSelect,
  DsFeedback,
  DsAvatar,
  DsRow,
  appearance as pilotAppearance,
  tokens,
} from '../../src/design-system';
import { isDesignCatalogEnabled } from '../../src/design-system/availability';
import { apiConfiguration } from '../../src/config/environment';
import { useAuthenticatedApi, useResource } from '../../src/data/hooks';
import {
  profileForm,
  profileUpdate,
  type ProfileForm,
  type ProfileUser,
} from '../../src/features/account/forms';
import {
  profileFieldChange,
  profileHasChanges,
  profileMonths,
} from '../../src/features/account/profile-presentation';
import { SessionCleanup } from '../../src/features/account/session-cleanup';
import { DeleteAccount } from '../../src/features/account/delete-account';
import { NotificationSettings } from '../../src/features/notifications';
import { useSession } from '../../src/session/provider';

interface ProfileEditor {
  user: ProfileUser;
  form: ProfileForm;
}

export default function ProfileScreen() {
  const { state } = useSession();
  return <ProfileContent key={state.identity?.user.id ?? 'signed-out'} />;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1900 + 1 }, (_, index) => ({
  value: String(currentYear - index),
  label: String(currentYear - index),
}));

function ProfileContent() {
  const { state, controller } = useSession();
  const scope = state.status === 'authenticated' ? state.identity : null;
  const { request } = useAuthenticatedApi();
  const { data, loading, error, reload } = useResource<{ user: ProfileUser }>(
    '/api/v1/mobile/me',
  );
  const [editor, setEditor] = useState<ProfileEditor | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const focused = useRef(false);
  const action = useRef<AbortController | null>(null);
  const signingOut = useRef(false);

  useEffect(() => {
    if (data)
      setEditor((current) => ({
        user: data.user,
        form:
          current && profileHasChanges(current.form, current.user)
            ? current.form
            : profileForm(data.user),
      }));
  }, [data]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        action.current?.abort();
        action.current = null;
        signingOut.current = false;
        setSaving(false);
        setLoggingOut(false);
        setMessage(null);
        setSaveError(null);
      };
    }, [scope]),
  );
  function isCurrent(abort: AbortController) {
    const snapshot = controller.getSnapshot();
    return (
      focused.current &&
      !abort.signal.aborted &&
      action.current === abort &&
      snapshot.status === 'authenticated' &&
      snapshot.identity === scope
    );
  }
  function change(field: keyof ProfileForm, value: string) {
    if (action.current || signingOut.current) return;
    setEditor(
      (current) =>
        current && {
          ...current,
          form: profileFieldChange(current.form, field, value),
        },
    );
    setMessage(null);
    setSaveError(null);
  }
  async function save() {
    if (
      !editor ||
      !data ||
      !scope ||
      !focused.current ||
      action.current ||
      signingOut.current ||
      !profileHasChanges(editor.form, editor.user)
    )
      return;
    setMessage(null);
    setSaveError(null);
    let body: ReturnType<typeof profileUpdate>;
    try {
      body = profileUpdate(editor.form, editor.user);
    } catch (cause) {
      setSaveError(
        cause instanceof Error ? cause.message : 'Confira os dados do perfil.',
      );
      return;
    }
    const abort = new AbortController();
    action.current = abort;
    setSaving(true);
    try {
      const updated = await request<ProfileUser>('/api/v1/users', {
        method: 'PATCH',
        body,
        signal: abort.signal,
      });
      if (!isCurrent(abort)) return;
      setEditor({ user: updated, form: profileForm(updated) });
      setMessage('Perfil atualizado com sucesso.');
      await reload();
    } catch (cause) {
      if (isCurrent(abort))
        setSaveError(
          cause instanceof Error
            ? cause.message
            : 'Não foi possível salvar seu perfil. Tente novamente.',
        );
    } finally {
      if (isCurrent(abort)) {
        action.current = null;
        setSaving(false);
      }
    }
  }
  async function logout() {
    if (signingOut.current || action.current || !focused.current) return;
    signingOut.current = true;
    setLoggingOut(true);
    try {
      await controller.logout();
    } finally {
      if (focused.current) {
        signingOut.current = false;
        setLoggingOut(false);
      }
    }
  }
  const pending = saving || loggingOut;
  const dirty = editor ? profileHasChanges(editor.form, editor.user) : false;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.intro}>
            <DsText role="title" accessibilityRole="header">
              Meu perfil
            </DsText>
            <DsText role="caption" style={styles.muted}>
              Atualize suas informações pessoais.
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
          {data && editor && (
            <>
              <View style={styles.identity}>
                <DsAvatar name={editor.user.name} size={88} />
                <View style={styles.identityText}>
                  <DsText role="section" style={styles.identityName}>
                    {editor.user.name}
                  </DsText>
                  <DsText selectable role="caption" style={styles.email}>
                    {editor.user.email}
                  </DsText>
                </View>
              </View>
              <DsCard style={styles.form}>
                <DsField
                  label="Nome"
                  accessibilityLabel="Nome"
                  autoComplete="name"
                  value={editor.form.name}
                  onChangeText={(value) => change('name', value)}
                  editable={!pending}
                  maxLength={100}
                  autoCapitalize="words"
                />
                <DsField
                  label="E-mail"
                  accessibilityLabel="E-mail, não pode ser alterado"
                  value={editor.user.email}
                  editable={false}
                  hint="O e-mail não pode ser alterado."
                />
                <View style={styles.field}>
                  <DsText role="label">Data de nascimento</DsText>
                  <View style={styles.birthday}>
                    <View style={styles.day}>
                      <DsField
                        accessibilityLabel="Dia de nascimento"
                        value={editor.form.day}
                        onChangeText={(value) => change('day', value)}
                        editable={!pending}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="Dia"
                        style={styles.centeredInput}
                      />
                    </View>
                    <View style={styles.month}>
                      <DsSelect
                        label="Mês"
                        value={editor.form.month}
                        options={profileMonths}
                        onChange={(value) => change('month', value)}
                        disabled={pending}
                      />
                    </View>
                    <View style={styles.year}>
                      <DsSelect
                        label="Ano"
                        value={editor.form.year}
                        options={years}
                        onChange={(value) => change('year', value)}
                        disabled={pending}
                      />
                    </View>
                  </View>
                </View>
                {saveError && <DsFeedback message={saveError} tone="error" />}
                {message && <DsFeedback message={message} tone="success" />}
                <DsButton
                  label={saving ? 'Salvando...' : 'Salvar alterações'}
                  pending={saving}
                  disabled={!dirty || loggingOut}
                  onPress={() => {
                    void save();
                  }}
                  style={styles.save}
                />
              </DsCard>
            </>
          )}
          <DsCard style={styles.logoutCard}>
            <View style={styles.field}>
              <DsText role="label">Sair da conta</DsText>
              <DsText role="caption" style={styles.muted}>
                Você será desconectado deste dispositivo. Pode entrar de novo a
                qualquer momento.
              </DsText>
            </View>
            <DsButton
              label={loggingOut ? 'Saindo...' : 'Sair da conta'}
              variant="destructive"
              pending={loggingOut}
              disabled={saving}
              onPress={() => {
                void logout();
              }}
              icon={<LogOut size={18} color={tokens.colors.danger} />}
              style={styles.save}
            />
          </DsCard>
          {state.message && <DsFeedback message={state.message} tone="error" />}
          <DeleteAccount appearance={pilotAppearance} />
          <DsRow
            title="Datas especiais"
            subtitle="Seus lembretes de datas comemorativas"
            onPress={() => router.navigate('/(tabs)/occasions')}
          />
          <DsRow
            title="Mais opções da conta"
            accessibilityState={{ expanded }}
            subtitle={
              expanded
                ? 'Recolher segurança e notificações'
                : 'Segurança e notificações'
            }
            onPress={() => setExpanded((value) => !value)}
            trailing={
              expanded ? (
                <ChevronUp size={20} color={tokens.colors.textMuted} />
              ) : (
                <ChevronDown size={20} color={tokens.colors.textMuted} />
              )
            }
          />
          {expanded && (
            <View style={styles.secondary}>
              <SessionCleanup appearance={pilotAppearance} />
              <NotificationSettings appearance={pilotAppearance} />
            </View>
          )}
          {isDesignCatalogEnabled(apiConfiguration.environment, __DEV__) && (
            <DsButton
              label="Catálogo do design system"
              variant="text"
              onPress={() => router.push('/design-system')}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
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
  form: { gap: 16, padding: 16, borderRadius: 16 },
  field: { gap: 8 },
  birthday: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
  },
  day: { flexBasis: 60, flexGrow: 1 },
  month: { flexBasis: 112, flexGrow: 3 },
  year: { flexBasis: 88, flexGrow: 1 },
  centeredInput: { textAlign: 'center' },
  save: { alignSelf: 'flex-start', maxWidth: '100%' },
  logoutCard: { gap: 12, padding: 16, borderRadius: 16 },
  secondary: { gap: 16 },
});
