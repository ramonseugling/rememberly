import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronUp, LogOut, Mail } from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandButton } from '../../src/components/brand-button/brand-button';
import { Text } from '../../src/components/brand-text/brand-text';
import { SelectField } from '../../src/components/select-field/select-field';
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
import { theme } from '../../src/theme';

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
            <Text accessibilityRole="header" style={styles.heading}>
              Meu perfil
            </Text>
            <Text style={styles.body}>Atualize suas informações pessoais.</Text>
          </View>
          {loading && !data && (
            <ActivityIndicator
              accessibilityLabel="Carregando perfil"
              color={theme.colors.primary}
            />
          )}
          {error && (
            <View style={styles.card}>
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
              <BrandButton
                label="Tentar novamente"
                variant="outline"
                onPress={() => {
                  void reload();
                }}
              />
            </View>
          )}
          {data && editor && (
            <>
              <View style={[styles.card, styles.identity]}>
                <View style={styles.avatar}>
                  <Text style={styles.initial}>
                    {editor.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.identityName}>{editor.user.name}</Text>
                  <View style={styles.mailRow}>
                    <Mail size={14} color={theme.colors.muted} />
                    <Text selectable style={styles.email}>
                      {editor.user.email}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.card}>
                <View style={styles.field}>
                  <Text style={styles.label}>Nome</Text>
                  <TextInput
                    accessibilityLabel="Nome"
                    autoComplete="name"
                    value={editor.form.name}
                    onChangeText={(value) => change('name', value)}
                    editable={!pending}
                    style={styles.input}
                    maxLength={100}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>E-mail</Text>
                  <TextInput
                    accessibilityLabel="E-mail, não pode ser alterado"
                    value={editor.user.email}
                    editable={false}
                    style={[styles.input, styles.disabledEmail]}
                  />
                  <Text style={styles.caption}>
                    O e-mail não pode ser alterado.
                  </Text>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Data de nascimento</Text>
                  <View style={styles.birthday}>
                    <TextInput
                      accessibilityLabel="Dia de nascimento"
                      value={editor.form.day}
                      onChangeText={(value) => change('day', value)}
                      editable={!pending}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={[styles.input, styles.day]}
                      placeholder="Dia"
                      placeholderTextColor={theme.colors.muted}
                    />
                    <View style={styles.month}>
                      <SelectField
                        label="Mês"
                        value={editor.form.month}
                        options={profileMonths}
                        onChange={(value) => change('month', value)}
                        disabled={pending}
                      />
                    </View>
                    <View style={styles.year}>
                      <SelectField
                        label="Ano"
                        value={editor.form.year}
                        options={years}
                        onChange={(value) => change('year', value)}
                        disabled={pending}
                      />
                    </View>
                  </View>
                </View>
                {saveError && (
                  <Text accessibilityRole="alert" style={styles.error}>
                    {saveError}
                  </Text>
                )}
                {message && (
                  <Text accessibilityLiveRegion="polite" style={styles.body}>
                    {message}
                  </Text>
                )}
                <BrandButton
                  label={saving ? 'Salvando...' : 'Salvar alterações'}
                  pending={saving}
                  disabled={!dirty || loggingOut}
                  onPress={() => {
                    void save();
                  }}
                  style={styles.save}
                />
              </View>
            </>
          )}
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Sair da conta</Text>
              <Text style={styles.caption}>
                Você será desconectado deste dispositivo. Pode entrar de novo a
                qualquer momento.
              </Text>
            </View>
            <BrandButton
              label={loggingOut ? 'Saindo...' : 'Sair da conta'}
              variant="destructive"
              pending={loggingOut}
              disabled={saving}
              onPress={() => {
                void logout();
              }}
              icon={<LogOut size={16} color={theme.colors.destructive} />}
              style={styles.logout}
            />
          </View>
          {state.message && (
            <Text accessibilityRole="alert" style={styles.error}>
              {state.message}
            </Text>
          )}
          <DeleteAccount />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mais opções da conta"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((value) => !value)}
            style={styles.expand}
          >
            <Text style={styles.body}>Mais opções da conta</Text>
            {expanded ? (
              <ChevronUp size={18} color={theme.colors.muted} />
            ) : (
              <ChevronDown size={18} color={theme.colors.muted} />
            )}
          </Pressable>
          {expanded && (
            <View style={styles.secondary}>
              <SessionCleanup />
              <NotificationSettings />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 24,
  },
  intro: { gap: 4 },
  heading: {
    fontSize: 30,
    color: theme.colors.foreground,
    fontFamily: theme.fonts.headingBold,
    lineHeight: 36,
  },
  body: { fontSize: 14, color: theme.colors.muted, lineHeight: 21 },
  caption: { fontSize: 12, color: theme.colors.muted, lineHeight: 18 },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
    padding: 20,
    gap: 20,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(235, 109, 151, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: theme.colors.primary,
    fontSize: 28,
    fontFamily: theme.fonts.headingBold,
  },
  identityText: { flex: 1, minWidth: 0, gap: 4 },
  identityName: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.foreground,
  },
  mailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  email: { flex: 1, fontSize: 14, color: theme.colors.muted },
  field: { gap: 6 },
  label: {
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.colors.foreground,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.foreground,
  },
  disabledEmail: { opacity: 0.6 },
  birthday: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
  },
  day: { flexBasis: 60, flexGrow: 1, textAlign: 'center' },
  month: { flexBasis: 112, flexGrow: 3 },
  year: { flexBasis: 88, flexGrow: 1 },
  save: { alignSelf: 'flex-end', maxWidth: '100%' },
  logout: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderColor: theme.colors.destructive,
  },
  error: { fontSize: 14, lineHeight: 21, color: theme.colors.destructive },
  expand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  secondary: { gap: 16 },
});
