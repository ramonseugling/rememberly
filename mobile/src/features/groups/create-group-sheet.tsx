import { DsButton, DsFeedback, DsField, DsSheet } from '../../design-system';

interface CreateGroupSheetProps {
  visible: boolean;
  name: string;
  error: string | null;
  pending: boolean;
  onChangeName: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const CreateGroupSheet = ({
  visible,
  name,
  error,
  pending,
  onChangeName,
  onSubmit,
  onClose,
}: CreateGroupSheetProps) => (
  <DsSheet
    title="Criar grupo"
    visible={visible}
    pending={pending}
    onClose={onClose}
  >
    <DsField
      label="Nome do grupo"
      accessibilityLabel="Nome do novo grupo"
      placeholder="Ex: Família Silva, Amigos do trabalho"
      value={name}
      onChangeText={onChangeName}
      editable={!pending}
      maxLength={100}
      autoCapitalize="sentences"
      returnKeyType="done"
      onSubmitEditing={onSubmit}
    />
    {error && <DsFeedback tone="error" message={error} />}
    <DsButton label="Criar grupo" pending={pending} onPress={onSubmit} />
  </DsSheet>
);
