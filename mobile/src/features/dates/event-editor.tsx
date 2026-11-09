import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DsButton,
  DsConfirmSheet,
  DsField,
  DsFeedback,
  DsSelect,
  DsSheet,
  DsText,
} from '../../design-system';
import { tokens } from '../../design-system/tokens';
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
  const [confirming, setConfirming] = useState(false);
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
    <DsSheet
      title={item ? 'Editar evento' : 'Adicionar evento'}
      pending={pending}
      onClose={onClose}
    >
      <DsField
        label="Título"
        accessibilityLabel="Título do evento"
        placeholder="Ex: Aniversário da Ana"
        value={form.title}
        onChangeText={(value) => change('title', value)}
        maxLength={200}
        editable={!pending}
        autoCapitalize="sentences"
      />
      <View style={styles.field}>
        <DsText role="label">Tipo de evento</DsText>
        <DsSelect
          label="Tipo de evento"
          value={form.type}
          options={eventTypes}
          disabled={pending}
          onChange={(value) => {
            change('type', value as EventForm['type']);
            if (value !== 'custom') change('customType', '');
          }}
        />
        {form.type === 'custom' && (
          <DsField
            label="Tipo personalizado"
            accessibilityLabel="Tipo personalizado"
            placeholder="Ex: Formatura, Dia dos melhores amigos"
            value={form.customType}
            onChangeText={(value) => change('customType', value)}
            maxLength={100}
            editable={!pending}
          />
        )}
      </View>
      <View style={styles.field}>
        <DsText role="label">Data</DsText>
        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <DsSelect
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
            <DsSelect
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
        <DsText role="label">Notificação antecipada</DsText>
        <DsSelect
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
        <DsText role="caption" style={styles.description}>
          Você também receberá a notificação no dia do evento.
        </DsText>
      </View>
      {(validation || error) && (
        <DsFeedback message={validation || error || ''} tone="error" />
      )}
      <View style={styles.actions}>
        {item && onDelete && (
          <DsButton
            label="Excluir"
            variant="destructive"
            disabled={pending}
            onPress={() => setConfirming(true)}
            style={styles.action}
          />
        )}
        <DsButton
          label={pending ? 'Salvando...' : item ? 'Salvar' : 'Adicionar evento'}
          pending={pending}
          disabled={!!item && !dirty}
          onPress={submit}
          style={styles.action}
        />
      </View>
      {item && onDelete && (
        <DsConfirmSheet
          visible={confirming}
          title="Excluir evento?"
          message={`“${item.title}” será removido permanentemente.`}
          confirmLabel="Excluir"
          pending={pending}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onDelete();
          }}
        />
      )}
    </DsSheet>
  );
};

const styles = StyleSheet.create({
  field: { gap: 8 },
  description: { color: tokens.colors.textMuted },
  row: { flexDirection: 'row', gap: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  action: { flexBasis: 120, flexGrow: 1 },
});
