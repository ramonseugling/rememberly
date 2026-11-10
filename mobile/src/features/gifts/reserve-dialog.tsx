import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink, Gift, Link2, Lock, Text } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  DsAvatar,
  DsBackHeader,
  DsButton,
  DsFeedback,
  DsText,
  tokens,
} from '../../design-system';
import { isWebLink, reserveActions } from './member';
import type { MemberGiftItem, ReserveAction } from './member';
import { giftHost } from './model';

interface ReserveDialogProps {
  item: MemberGiftItem;
  ownerName: string;
  ownerPhotoUri?: string | null;
  pending: boolean;
  error: string | null;
  onAction: (action: ReserveAction) => void;
  onClose: () => void;
}

function copyFor(item: MemberGiftItem, ownerName: string) {
  if (item.availability === 'available')
    return {
      title: 'Reservar este presente?',
      body: `Os outros membros verão que ele já foi reservado, mas ${ownerName} não vai saber quem escolheu.`,
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

function DetailRow({
  icon,
  label,
  children,
  divider,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  divider: boolean;
}) {
  return (
    <View style={[styles.detailRow, divider && styles.divider]}>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={styles.detailCopy}>
        <DsText role="caption" style={styles.detailLabel}>
          {label}
        </DsText>
        {children}
      </View>
    </View>
  );
}

const ReserveBody = ({
  item,
  ownerName,
  ownerPhotoUri,
  pending,
  error,
  onAction,
  onClose,
}: ReserveDialogProps) => {
  const insets = useSafeAreaInsets();
  const actions = reserveActions(item);
  const { title, body } = copyFor(item, ownerName);
  const link = item.link && isWebLink(item.link) ? item.link : null;
  const close = () => {
    if (!pending) onClose();
  };
  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <DsBackHeader label={`Lista de ${ownerName}`} onPress={close} />
        <View style={styles.hero}>
          {item.photo_url ? (
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: item.photo_url }}
              style={styles.photo}
            />
          ) : (
            <LinearGradient
              colors={tokens.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.icon}
            >
              <Gift size={40} color={tokens.colors.onPrimary} />
            </LinearGradient>
          )}
          <View style={styles.heroCopy}>
            <DsText
              accessibilityRole="header"
              role="title"
              style={styles.centered}
            >
              {item.title}
            </DsText>
            <DsText role="caption" style={[styles.centered, styles.muted]}>
              {title}
            </DsText>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <DsAvatar name={ownerName} size={44} photoUri={ownerPhotoUri} />
            <View style={styles.detailCopy}>
              <DsText role="caption" style={styles.detailLabel}>
                Para
              </DsText>
              <DsText role="label">{ownerName}</DsText>
            </View>
          </View>
          {item.description && (
            <DetailRow
              divider
              icon={<Text size={20} color={tokens.colors.brand} />}
              label="Detalhes"
            >
              <DsText role="label">{item.description}</DsText>
            </DetailRow>
          )}
          {link && (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Abrir ${giftHost(link)}`}
              onPress={() => {
                void Linking.openURL(link).catch(() => {});
              }}
            >
              <DetailRow
                divider
                icon={<Link2 size={20} color={tokens.colors.brand} />}
                label="Link"
              >
                <View style={styles.linkLine}>
                  <DsText role="label" numberOfLines={1} style={styles.link}>
                    {giftHost(link)}
                  </DsText>
                  <ExternalLink size={18} color={tokens.colors.textMuted} />
                </View>
              </DetailRow>
            </Pressable>
          )}
        </View>
        <LinearGradient
          colors={tokens.celebration}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.note}
        >
          <Lock size={22} color={tokens.colors.brand} />
          <DsText role="caption" style={[styles.noteText, styles.muted]}>
            {body}
          </DsText>
        </LinearGradient>
        {error && <DsFeedback tone="error" message={error} />}
      </ScrollView>
      <View style={styles.actions}>
        {actions.map((action) => (
          <DsButton
            key={action}
            label={
              action === 'reserve'
                ? 'Reservar presente'
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
        {actions.length === 0 && (
          <DsButton
            label="Fechar"
            variant="soft"
            disabled={pending}
            onPress={close}
          />
        )}
      </View>
    </View>
  );
};

export const ReserveDialog = (props: ReserveDialogProps) => (
  <Modal
    animationType="slide"
    presentationStyle="fullScreen"
    visible
    onRequestClose={() => {
      if (!props.pending) props.onClose();
    }}
  >
    <SafeAreaProvider>
      <ReserveBody {...props} />
    </SafeAreaProvider>
  </Modal>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
  },
  hero: { alignItems: 'center', gap: 12 },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: 160, height: 160, borderRadius: 32 },
  heroCopy: { alignSelf: 'stretch', gap: 4 },
  centered: { textAlign: 'center' },
  muted: { color: tokens.colors.textMuted },
  card: {
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  divider: { borderTopWidth: 1, borderTopColor: tokens.colors.border },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.iconSurface,
  },
  detailCopy: { flex: 1, minWidth: 0 },
  detailLabel: { color: tokens.colors.textMuted, fontWeight: '600' },
  linkLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { flex: 1, color: tokens.colors.brand },
  note: {
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noteText: { flex: 1 },
  actions: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
});
