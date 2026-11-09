import { LinearGradient } from 'expo-linear-gradient';
import { Gift } from 'lucide-react-native';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { DsButton, DsFeedback, DsText, tokens } from '../../design-system';
import { isWebLink, reserveActions } from './member';
import type { MemberGiftItem, ReserveAction } from './member';
import { giftHost } from './model';

interface ReserveDialogProps {
  item: MemberGiftItem;
  ownerName: string;
  pending: boolean;
  error: string | null;
  onAction: (action: ReserveAction) => void;
  onClose: () => void;
}

function copyFor(item: MemberGiftItem, ownerName: string) {
  if (item.availability === 'available')
    return {
      title: 'Reservar este presente?',
      body: `Os outros membros verão que ele já foi reservado, mas ${ownerName} não vai saber.`,
    };
  if (!item.reserved_by_me)
    return {
      title: 'Presente já escolhido',
      body: 'Outra pessoa já reservou ou comprou este presente.',
    };
  return item.availability === 'reserved'
    ? {
        title: 'Você reservou este presente',
        body: `Marque como comprado quando fizer a compra, ou cancele a reserva. ${ownerName} não vê quem reservou.`,
      }
    : {
        title: 'Você comprou este presente',
        body: `${ownerName} não vê quem comprou. Se mudar de ideia, você pode desfazer.`,
      };
}

export const ReserveDialog = ({
  item,
  ownerName,
  pending,
  error,
  onAction,
  onClose,
}: ReserveDialogProps) => {
  const actions = reserveActions(item);
  const { title, body } = copyFor(item, ownerName);
  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={() => {
        if (!pending) onClose();
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Fechar"
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!pending) onClose();
          }}
        />
        <View accessibilityViewIsModal style={styles.dialog}>
          <LinearGradient
            colors={tokens.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.icon}
          >
            <Gift size={34} color={tokens.colors.onPrimary} />
          </LinearGradient>
          <View style={styles.copy}>
            <DsText role="section" style={styles.centered}>
              {title}
            </DsText>
            <DsText role="caption" style={[styles.centered, styles.muted]}>
              <DsText role="caption" style={styles.bold}>
                {item.title}
              </DsText>
              {`, de ${ownerName}. `}
              {body}
            </DsText>
            {item.description && (
              <DsText role="caption" style={[styles.centered, styles.muted]}>
                {item.description}
              </DsText>
            )}
          </View>
          {item.link && isWebLink(item.link) && (
            <DsButton
              label={`Abrir ${giftHost(item.link)}`}
              variant="text"
              onPress={() => {
                void Linking.openURL(item.link ?? '').catch(() => {});
              }}
            />
          )}
          {error && <DsFeedback tone="error" message={error} />}
          <View style={styles.actions}>
            {actions.map((action) => (
              <DsButton
                key={action}
                label={
                  action === 'reserve'
                    ? 'Reservar'
                    : action === 'purchase'
                      ? 'Já comprei'
                      : item.availability === 'purchased'
                        ? 'Desfazer compra'
                        : 'Cancelar reserva'
                }
                variant={
                  action === 'reserve' ||
                  (action === 'purchase' && !actions.includes('reserve'))
                    ? 'primary'
                    : 'soft'
                }
                pending={pending}
                disabled={pending}
                onPress={() => onAction(action)}
              />
            ))}
            <DsButton
              label={actions.includes('reserve') ? 'Cancelar' : 'Fechar'}
              variant="text"
              disabled={pending}
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: tokens.colors.overlay,
  },
  dialog: {
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
    borderRadius: 28,
    backgroundColor: tokens.colors.surface,
    boxShadow: '0 16px 40px rgba(35, 26, 34, 0.28)',
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: 8, alignSelf: 'stretch' },
  centered: { textAlign: 'center' },
  muted: { color: tokens.colors.textMuted },
  bold: { fontFamily: tokens.fonts.bold, fontWeight: '700' },
  actions: { alignSelf: 'stretch', gap: 8 },
});
