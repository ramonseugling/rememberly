import { Text } from '../../components/brand-text/brand-text';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import {
  eventPayload,
  eventTypes,
  formForEvent,
  reminderDays,
  reminderLabel,
} from './model';
import type { AgendaItem, EventForm, EventPayload } from './model';

interface Props {
  item?: AgendaItem;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: EventPayload) => void;
}

export function EventEditor({ item, pending, error, onClose, onSave }: Props) {
  const [form, setForm] = useState(() => formForEvent(item));
  const [validation, setValidation] = useState<string | null>(null);
  function change<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setValidation(null);
  }
  function submit() {
    const result = eventPayload(form);
    setValidation(result.error);
    if (result.payload) onSave(result.payload);
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => {
        if (!pending) onClose();
      }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.safeArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text accessibilityRole="header" style={styles.heading}>
              {item ? 'Edit date' : 'Add a date'}
            </Text>
            <Text style={styles.label}>Title</Text>
            <TextInput
              accessibilityLabel="Event title"
              style={styles.input}
              value={form.title}
              onChangeText={(value) => change('title', value)}
              maxLength={200}
              editable={!pending}
              autoCapitalize="sentences"
            />
            <Text style={styles.label}>Type</Text>
            <View style={styles.choices}>
              {eventTypes.map((type) => (
                <Pressable
                  key={type.value}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: form.type === type.value,
                    disabled: pending,
                  }}
                  disabled={pending}
                  onPress={() => change('type', type.value)}
                  style={[
                    styles.choice,
                    form.type === type.value && styles.selected,
                  ]}
                >
                  <Text style={styles.label}>{type.label}</Text>
                </Pressable>
              ))}
            </View>
            {form.type === 'custom' && (
              <>
                <Text style={styles.label}>Custom type</Text>
                <TextInput
                  accessibilityLabel="Custom event type"
                  style={styles.input}
                  value={form.customType}
                  onChangeText={(value) => change('customType', value)}
                  maxLength={100}
                  editable={!pending}
                />
              </>
            )}
            <View style={styles.row}>
              <View style={styles.dateField}>
                <Text style={styles.label}>Day (1–31)</Text>
                <TextInput
                  accessibilityLabel="Event day, 1 to 31"
                  style={styles.input}
                  value={form.day}
                  onChangeText={(value) => change('day', value)}
                  inputMode="numeric"
                  maxLength={2}
                  editable={!pending}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.label}>Month (1–12)</Text>
                <TextInput
                  accessibilityLabel="Event month, 1 to 12"
                  style={styles.input}
                  value={form.month}
                  onChangeText={(value) => change('month', value)}
                  inputMode="numeric"
                  maxLength={2}
                  editable={!pending}
                />
              </View>
            </View>
            <Text style={styles.label}>Reminder preference</Text>
            <View style={styles.choices}>
              {reminderDays.map((days) => (
                <Pressable
                  key={days}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: form.reminder === days,
                    disabled: pending,
                  }}
                  disabled={pending}
                  onPress={() => change('reminder', days)}
                  style={[
                    styles.choice,
                    form.reminder === days && styles.selected,
                  ]}
                >
                  <Text style={styles.label}>{reminderLabel(days)}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.description}>
              Dates repeat annually. Saving a reminder preference does not
              enable device push notifications.
            </Text>
            {(validation || error) && (
              <Text accessibilityRole="alert" style={styles.error}>
                {validation || error}
              </Text>
            )}
            {pending && (
              <ActivityIndicator
                accessibilityLabel="Saving date"
                color={theme.colors.foreground}
              />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: pending, busy: pending }}
              disabled={pending}
              onPress={submit}
              style={[styles.button, pending && styles.disabled]}
            >
              <Text style={styles.label}>
                {pending ? 'Saving…' : 'Save date'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              accessibilityState={{ disabled: pending }}
              onPress={onClose}
              style={styles.choice}
            >
              <Text style={styles.label}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 12 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: theme.fonts.heading,
    color: theme.colors.foreground,
  },
  label: { color: theme.colors.foreground, fontSize: 16, fontWeight: '600' },
  description: { fontSize: 15, lineHeight: 22, color: theme.colors.muted },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    padding: 14,
    minHeight: 48,
    color: theme.colors.foreground,
    fontSize: 17,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 48,
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
  },
  selected: { borderColor: theme.colors.foreground, borderWidth: 2 },
  row: { flexDirection: 'row', gap: 16 },
  dateField: { flex: 1, gap: 8 },
  button: {
    minHeight: 48,
    borderRadius: 12,
    padding: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  error: { color: theme.colors.foreground, fontSize: 16 },
});
