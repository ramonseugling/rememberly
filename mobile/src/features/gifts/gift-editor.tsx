import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DsButton,
  DsConfirmSheet,
  DsFeedback,
  DsField,
  DsSheet,
} from '../../design-system';
import { tokens } from '../../design-system/tokens';
import { formForGift, giftPayload } from './model';
import type { GiftForm, GiftItem, GiftPayload } from './model';

interface GiftEditorProps {
  item?: GiftItem;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: GiftPayload) => void;
  onDelete?: () => void;
}

export const GiftEditor = ({
  item,
  pending,
  error,
  onClose,
  onSave,
  onDelete,
}: GiftEditorProps) => {
  const [form, setForm] = useState(() => formForGift(item));
  const [validation, setValidation] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const initial = formForGift(item);
  const dirty = (Object.keys(form) as (keyof GiftForm)[]).some(
    (key) => form[key] !== initial[key],
  );
  function change(key: keyof GiftForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setValidation(null);
  }
  function submit() {
    if (pending) return;
    const result = giftPayload(form);
    setValidation(result.error);
    if (result.payload) onSave(result.payload);
  }
  return (
    <DsSheet
      title={item ? 'Editar presente' : 'Adicionar presente'}
      pending={pending}
      onClose={onClose}
    >
      <DsField
        label="Nome do presente *"
        accessibilityLabel="Nome do presente"
        placeholder="Ex.: Fone de ouvido"
        value={form.title}
        onChangeText={(value) => change('title', value)}
        maxLength={100}
        editable={!pending}
        autoCapitalize="sentences"
      />
      <DsField
        label="Link (opcional)"
        accessibilityLabel="Link do presente"
        placeholder="https://"
        value={form.link}
        onChangeText={(value) => change('link', value)}
        maxLength={2000}
        editable={!pending}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <DsField
        label="Descrição (opcional)"
        accessibilityLabel="Descrição do presente"
        placeholder="Ex.: Prefiro na cor preta."
        value={form.description}
        onChangeText={(value) => change('description', value)}
        maxLength={500}
        editable={!pending}
        multiline
        autoCapitalize="sentences"
      />
      {(validation || error) && (
        <DsFeedback message={validation || error || ''} tone="error" />
      )}
      <View style={styles.actions}>
        {item && onDelete && (
          <DsButton
            label="Excluir"
            variant="destructive"
            icon={<Trash2 size={18} color={tokens.colors.danger} />}
            disabled={pending}
            onPress={() => setConfirming(true)}
            style={styles.action}
          />
        )}
        <DsButton
          label={
            pending ? 'Salvando...' : item ? 'Salvar' : 'Adicionar presente'
          }
          pending={pending}
          disabled={!!item && !dirty}
          onPress={submit}
          style={styles.action}
        />
      </View>
      {item && onDelete && (
        <DsConfirmSheet
          visible={confirming}
          title="Excluir presente?"
          message={`“${item.title}” será removido da sua lista.`}
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  action: { flexBasis: 120, flexGrow: 1 },
});
