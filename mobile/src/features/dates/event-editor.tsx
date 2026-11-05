import { dayOptions } from './editor-options';
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
import { SelectField } from '../../components/select-field/select-field';
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
              {item ? 'Editar data' : 'Adicionar data'}
            </Text>
            <Text style={styles.label}>Título</Text>
            <TextInput
              accessibilityLabel="Título da data"
              style={styles.input}
              value={form.title}
              onChangeText={(value) => change('title', value)}
              maxLength={200}
              editable={!pending}
              autoCapitalize="sentences"
            />
            <Text style={styles.label}>Tipo</Text>
            <SelectField
              label="Tipo"
              value={form.type}
              options={eventTypes}
              disabled={pending}
              onChange={(value) => {
                change('type', value as EventForm['type']);
                if (value !== 'custom') change('customType', '');
              }}
            />
            {form.type === 'custom' && (
              <>
                <Text style={styles.label}>Tipo personalizado</Text>
                <TextInput
                  accessibilityLabel="Tipo personalizado"
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
                <Text style={styles.label}>Mês</Text>
                <SelectField
                  label="Mês"
                  value={form.month}
                  disabled={pending}
                  options={[
                    'Janeiro',
                    'Fevereiro',
                    'Março',
                    'Abril',
                    'Maio',
                    'Junho',
                    'Julho',
                    'Agosto',
                    'Setembro',
                    'Outubro',
                    'Novembro',
                    'Dezembro',
                  ].map((label, index) => ({
                    label,
                    value: String(index + 1),
                  }))}
                  onChange={(value) => {
                    change('month', value);
                    change('day', '');
                  }}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.label}>Dia</Text>
                <SelectField
                  label="Dia"
                  value={form.day}
                  disabled={pending || !form.month}
                  options={dayOptions(form.month)}
                  onChange={(value) => change('day', value)}
                />
              </View>
            </View>
            <Text style={styles.label}>Notificação antecipada</Text>
            <SelectField
              label="Notificação antecipada"
              value={String(form.reminder)}
              options={reminderDays.map((days) => ({
                value: String(days),
                label:
                  days === 0
                    ? 'Somente no dia'
                    : days === 1
                      ? '1 dia antes'
                      : days + ' dias antes',
              }))}
              disabled={pending}
              onChange={(value) => change('reminder', Number(value))}
            />
            <Text style={styles.description}>
              As datas se repetem todos os anos. Você recebe lembretes por
              email.
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
                {pending ? 'Salvando...' : 'Salvar data'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              accessibilityState={{ disabled: pending }}
              onPress={onClose}
              style={styles.choice}
            >
              <Text style={styles.label}>Cancelar</Text>
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
