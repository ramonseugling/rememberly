import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { BottomSheet } from '../../components/bottom-sheet/bottom-sheet';
import { BrandButton } from '../../components/brand-button/brand-button';
import { Text } from '../../components/brand-text/brand-text';
import { SelectField } from '../../components/select-field/select-field';
import { theme } from '../../theme';
import { dayOptions } from './editor-options';
import { eventPayload, eventTypes, formForEvent, reminderDays } from './model';
import type { AgendaItem, EventForm, EventPayload } from './model';

interface EventEditorProps {
  item?: AgendaItem;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: EventPayload) => void;
  onDelete?: () => void;
}

const months = [
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
];

export const EventEditor = ({
  item,
  pending,
  error,
  onClose,
  onSave,
  onDelete,
}: EventEditorProps) => {
  const [form, setForm] = useState(() => formForEvent(item));
  const [validation, setValidation] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const initial = formForEvent(item);
  const dirty = (Object.keys(form) as (keyof EventForm)[]).some(
    (key) => form[key] !== initial[key],
  );
  function change<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setValidation(null);
  }
  function submit() {
    if (pending) return;
    const result = eventPayload(form);
    setValidation(result.error);
    if (result.payload) onSave(result.payload);
  }

  return (
    <BottomSheet
      title={item ? 'Editar data especial' : 'Adicionar data especial'}
      pending={pending}
      onClose={onClose}
    >
      <View style={styles.field}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          accessibilityLabel="Título da data"
          style={[styles.input, focused === 'title' && styles.focused]}
          placeholder="Ex: Aniversário da Ana"
          placeholderTextColor={theme.colors.muted}
          value={form.title}
          onChangeText={(value) => change('title', value)}
          maxLength={200}
          editable={!pending}
          autoCapitalize="sentences"
          onFocus={() => setFocused('title')}
          onBlur={() => setFocused(null)}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Tipo de data</Text>
        <SelectField
          label="Tipo de data"
          value={form.type}
          options={eventTypes}
          disabled={pending}
          onChange={(value) => {
            change('type', value as EventForm['type']);
            if (value !== 'custom') change('customType', '');
          }}
        />
        {form.type === 'custom' && (
          <TextInput
            accessibilityLabel="Tipo personalizado"
            style={[styles.input, focused === 'custom' && styles.focused]}
            placeholder="Ex: Formatura, Dia dos melhores amigos"
            placeholderTextColor={theme.colors.muted}
            value={form.customType}
            onChangeText={(value) => change('customType', value)}
            maxLength={100}
            editable={!pending}
            onFocus={() => setFocused('custom')}
            onBlur={() => setFocused(null)}
          />
        )}
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Data</Text>
        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <SelectField
              label="Mês"
              value={form.month}
              disabled={pending}
              options={months.map((label, index) => ({
                label,
                value: String(index + 1),
              }))}
              onChange={(value) => {
                change('month', value);
                change('day', '');
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField
              label="Dia"
              value={form.day}
              disabled={pending || !form.month}
              options={dayOptions(form.month)}
              onChange={(value) => change('day', value)}
            />
          </View>
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Notificação antecipada</Text>
        <SelectField
          label="Notificação antecipada"
          value={String(form.reminder)}
          disabled={pending}
          options={reminderDays.map((days) => ({
            value: String(days),
            label:
              days === 0
                ? 'Nenhuma'
                : days === 1
                  ? '1 dia antes'
                  : days + ' dias antes',
          }))}
          onChange={(value) => change('reminder', Number(value))}
        />
        <Text style={styles.description}>
          Você também receberá a notificação no dia do evento.
        </Text>
      </View>
      {(validation || error) && (
        <Text accessibilityRole="alert" style={styles.error}>
          {validation || error}
        </Text>
      )}
      <View style={styles.actions}>
        {item && onDelete && (
          <BrandButton
            label="Excluir"
            variant="destructive"
            disabled={pending}
            onPress={onDelete}
            style={{ flex: 1 }}
          />
        )}
        <BrandButton
          label={pending ? 'Salvando...' : item ? 'Salvar' : 'Adicionar data'}
          pending={pending}
          disabled={!!item && !dirty}
          onPress={submit}
          style={{ flex: 1 }}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: {
    color: theme.colors.foreground,
    fontFamily: theme.fonts.bold,
    fontSize: 14,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    color: theme.colors.foreground,
    fontSize: 14,
    fontFamily: theme.fonts.body,
  },
  focused: { borderColor: theme.colors.primary },
  row: { flexDirection: 'row', gap: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  error: { color: theme.colors.destructive, fontSize: 14 },
});
