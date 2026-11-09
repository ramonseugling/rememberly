import { StyleSheet, View } from 'react-native';
import { DsButton } from '../button/button';
import { DsSheet } from '../sheet/sheet';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DsConfirmSheet = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = true,
  pending = false,
  onConfirm,
  onCancel,
}: DsConfirmSheetProps) => (
  <DsSheet visible={visible} title={title} pending={pending} onClose={onCancel}>
    <View style={styles.body}>
      <DsText style={{ color: tokens.colors.textMuted }}>{message}</DsText>
      <View style={styles.actions}>
        <DsButton
          label={confirmLabel}
          variant={destructive ? 'destructive' : 'primary'}
          pending={pending}
          onPress={onConfirm}
        />
        <DsButton
          label={cancelLabel}
          variant="outline"
          disabled={pending}
          onPress={onCancel}
        />
      </View>
    </View>
  </DsSheet>
);

const styles = StyleSheet.create({
  body: { gap: 16 },
  actions: { gap: 8 },
});
