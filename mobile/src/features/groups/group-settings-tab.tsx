import { LogOut, Trash2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import {
  DsButton,
  DsFeedback,
  DsField,
  DsText,
  tokens,
} from '../../design-system';
import type { Group } from './model';

interface GroupSettingsTabProps {
  group: Group;
  rename: string;
  saved: boolean;
  pending: boolean;
  onChangeName: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onLeave: () => void;
}

export const GroupSettingsTab = ({
  group,
  rename,
  saved,
  pending,
  onChangeName,
  onSave,
  onDelete,
  onLeave,
}: GroupSettingsTabProps) => {
  if (group.role !== 'owner')
    return (
      <View style={styles.card}>
        <DsText role="section" style={styles.sectionTitle}>
          Sair do grupo
        </DsText>
        <DsText style={styles.muted}>
          Você perde acesso aos aniversários compartilhados pelo grupo.
        </DsText>
        <DsButton
          label="Sair do grupo"
          variant="destructive"
          icon={<LogOut size={18} color={tokens.colors.danger} />}
          disabled={pending}
          onPress={onLeave}
        />
      </View>
    );
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <DsField
          label="Nome do grupo"
          accessibilityLabel="Nome do grupo"
          value={rename}
          onChangeText={onChangeName}
          editable={!pending}
          maxLength={100}
        />
        <DsButton
          label="Salvar"
          pending={pending}
          disabled={rename.trim() === group.name}
          onPress={onSave}
          style={styles.save}
        />
        {saved && (
          <DsFeedback tone="success" message="Nome do grupo atualizado." />
        )}
      </View>
      <View style={styles.danger}>
        <View style={styles.dangerCopy}>
          <DsText role="section" style={styles.dangerTitle}>
            Zona de perigo
          </DsText>
          <DsText role="caption" style={styles.muted}>
            Deletar o grupo remove todos os membros permanentemente.
          </DsText>
        </View>
        <DsButton
          label="Deletar grupo"
          variant="destructive"
          icon={<Trash2 size={18} color={tokens.colors.danger} />}
          disabled={pending}
          onPress={onDelete}
          style={styles.save}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: 16 },
  card: {
    padding: 16,
    gap: 12,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  sectionTitle: { fontSize: 18, lineHeight: 24 },
  muted: { color: tokens.colors.textMuted },
  save: { alignSelf: 'stretch', minHeight: 52 },
  danger: {
    padding: 16,
    gap: 12,
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.colors.dangerSurface,
  },
  dangerCopy: { gap: 2 },
  dangerTitle: { fontSize: 18, lineHeight: 24, color: tokens.colors.danger },
});
