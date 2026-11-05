import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthenticatedApi, useResource } from '../../src/data/hooks';
import {
  profileForm,
  profileUpdate,
  type ProfileForm,
  type ProfileUser,
} from '../../src/features/account/forms';
import { SessionCleanup } from '../../src/features/account/session-cleanup';
import { DeleteAccount } from '../../src/features/account/delete-account';
import { NotificationSettings } from '../../src/features/notifications';
import { useSession } from '../../src/session/provider';
import { theme } from '../../src/theme';

export default function ProfileScreen() {
  const { state } = useSession();
  return <ProfileContent key={state.identity?.user.id ?? 'signed-out'} />;
}

function ProfileContent() {
  const { state, controller } = useSession();
  const { request } = useAuthenticatedApi();
  const { data, loading, error, reload } = useResource<{ user: ProfileUser }>(
    '/api/v1/mobile/me',
  );
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (data && !dirty && !saving) setForm(profileForm(data.user));
  }, [data, dirty, saving]);

  function change(field: keyof ProfileForm, value: string) {
    setForm((current) => current && { ...current, [field]: value });
    setDirty(true);
    setMessage(null);
  }

  async function save() {
    if (!form || !data || saving) return;
    setMessage(null);
    try {
      const body = profileUpdate(form, data.user);
      setSaving(true);
      await request('/api/v1/users', { method: 'PATCH', body });
      // Keep the submitted values until the canonical profile has been reread.
      await reload();
      setDirty(false);
      setMessage('Profile saved.');
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : 'Unable to save your profile. Try again.',
      );
    } finally {
      setSaving(false);
    }
  }

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
          <Text accessibilityRole="header" style={styles.heading}>
            Your profile
          </Text>
          {loading && (
            <ActivityIndicator accessibilityLabel="Loading profile" />
          )}
          {error && (
            <View style={styles.section}>
              <Text accessibilityRole="alert" style={styles.text}>
                {error}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void reload()}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Retry loading profile</Text>
              </Pressable>
            </View>
          )}
          {data && form && (
            <View style={styles.section}>
              <Text style={styles.label}>Email</Text>
              <Text selectable style={styles.text}>
                {data.user.email}
              </Text>
              <Text style={styles.hint}>
                Your email cannot be changed here.
              </Text>
              <Text style={styles.label}>Name</Text>
              <TextInput
                accessibilityLabel="Name"
                autoComplete="name"
                value={form.name}
                onChangeText={(value) => change('name', value)}
                editable={!saving}
                style={styles.input}
                maxLength={100}
              />
              <Text accessibilityRole="header" style={styles.label}>
                Birthday
              </Text>
              <Text style={styles.hint}>
                Optional fields may be left blank. Existing birthday values
                cannot be removed yet.
              </Text>
              {(['day', 'month', 'year'] as const).map((field) => (
                <View key={field} style={styles.section}>
                  <Text style={styles.label}>Birth {field}</Text>
                  <TextInput
                    accessibilityLabel={`Birth ${field}`}
                    value={form[field]}
                    onChangeText={(value) => change(field, value)}
                    editable={!saving}
                    keyboardType="number-pad"
                    maxLength={field === 'year' ? 4 : 2}
                    style={styles.input}
                    placeholder={
                      field === 'year'
                        ? 'YYYY'
                        : field === 'month'
                          ? 'MM'
                          : 'DD'
                    }
                    placeholderTextColor={theme.colors.muted}
                  />
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: saving || !dirty }}
                disabled={saving || !dirty}
                onPress={() => void save()}
                style={[styles.button, (saving || !dirty) && styles.disabled]}
              >
                <Text style={styles.buttonText}>
                  {saving ? 'Saving…' : 'Save profile'}
                </Text>
              </Pressable>
            </View>
          )}
          {message && (
            <Text accessibilityRole="alert" style={styles.text}>
              {message}
            </Text>
          )}
          <SessionCleanup />
          <NotificationSettings />
          {state.message && (
            <Text accessibilityRole="alert" style={styles.text}>
              {state.message}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => void controller.logout()}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Sign out</Text>
          </Pressable>
          <DeleteAccount />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 20 },
  section: { gap: 12 },
  heading: { fontSize: 32, color: theme.colors.foreground, fontWeight: '700' },
  label: { fontSize: 17, color: theme.colors.foreground, fontWeight: '600' },
  text: { fontSize: 17, color: theme.colors.muted, lineHeight: 26 },
  hint: { fontSize: 15, color: theme.colors.muted, lineHeight: 23 },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 16,
    minHeight: 48,
    fontSize: 17,
    color: theme.colors.foreground,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
