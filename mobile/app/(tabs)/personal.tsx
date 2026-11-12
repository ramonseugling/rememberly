import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
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
  DsBackHeader,
  DsButton,
  DsCard,
  DsFeedback,
  DsField,
  DsSelect,
  DsText,
  tokens,
} from '../../src/design-system';
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
import { useSession } from '../../src/session/provider';

interface ProfileEditor {
  user: ProfileUser;
  form: ProfileForm;
}

export default function PersonalScreen() {
  const { state } = useSession();
  return <PersonalContent key={state.identity?.user.id ?? 'signed-out'} />;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1900 + 1 }, (_, index) => ({
  value: String(currentYear - index),
  label: String(currentYear - index),
}));

function PersonalContent() {
  const { state, controller } = useSession();
  const scope = state.status === 'authenticated' ? state.identity : null;
  const { request } = useAuthenticatedApi();
  const { data, loading, error, reload } = useResource<{ user: ProfileUser }>(
    '/api/v1/mobile/me',
  );
  const [editor, setEditor] = useState<ProfileEditor | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const focused = useRef(false);
  const action = useRef<AbortController | null>(null);

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
        setSaving(false);
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
    if (action.current) return;
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
          <DsBackHeader
            label="Perfil"
            onPress={() => router.navigate('/(tabs)/profile')}
          />
          <View style={styles.intro}>
            <DsText role="title" accessibilityRole="header">
              Informações pessoais
            </DsText>
            <DsText role="caption" style={styles.muted}>
              Atualize seu nome e a data do seu aniversário.
            </DsText>
          </View>
          {loading && !data && (
            <ActivityIndicator
              accessibilityLabel="Carregando dados"
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
            <DsCard style={styles.form}>
              <DsField
                label="Nome"
                accessibilityLabel="Nome"
                autoComplete="given-name"
                value={editor.form.first_name}
                onChangeText={(value) => change('first_name', value)}
                editable={!saving}
                maxLength={60}
                autoCapitalize="words"
              />
              <DsField
                label="Sobrenome"
                accessibilityLabel="Sobrenome"
                autoComplete="family-name"
                value={editor.form.last_name}
                onChangeText={(value) => change('last_name', value)}
                editable={!saving}
                maxLength={60}
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
                <DsText role="label">Data de aniversário</DsText>
                <View style={styles.birthday}>
                  <View style={styles.day}>
                    <DsField
                      accessibilityLabel="Dia de nascimento"
                      value={editor.form.day}
                      onChangeText={(value) => change('day', value)}
                      editable={!saving}
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
                      disabled={saving}
                    />
                  </View>
                  <View style={styles.year}>
                    <DsSelect
                      label="Ano"
                      value={editor.form.year}
                      options={years}
                      onChange={(value) => change('year', value)}
                      disabled={saving}
                    />
                  </View>
                </View>
              </View>
              {saveError && <DsFeedback message={saveError} tone="error" />}
              {message && <DsFeedback message={message} tone="success" />}
              <DsButton
                label="Salvar alterações"
                pending={saving}
                disabled={!dirty}
                onPress={() => {
                  void save();
                }}
                style={styles.save}
              />
            </DsCard>
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
    paddingTop: 12,
    paddingBottom: tokens.tabBarClearance,
    gap: 16,
  },
  intro: { gap: 4 },
  muted: { color: tokens.colors.textMuted },
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
  save: { alignSelf: 'stretch', minHeight: 52 },
});
