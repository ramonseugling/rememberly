import { Gift, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
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
  DsConfirmSheet,
  DsFeedback,
  DsField,
  DsText,
} from '../../design-system';
import { tokens } from '../../design-system/tokens';
import { PhotoSheet } from '../photo/photo-sheet';
import { pickPhoto } from '../photo/pick-photo';
import { permissionDeniedMessage } from '../photo/photo-rules';
import type { PhotoSource } from '../photo/photo-rules';
import { formForGift, giftPayload } from './model';
import type { GiftForm, GiftItem, GiftPayload, GiftPhotoChange } from './model';

interface GiftEditorProps {
  item?: GiftItem;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: GiftPayload, photo: GiftPhotoChange) => void;
  onDelete?: () => void;
}

const GiftEditorBody = ({
  item,
  pending,
  error,
  onClose,
  onSave,
  onDelete,
}: GiftEditorProps) => {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(() => formForGift(item));
  const [validation, setValidation] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [photo, setPhoto] = useState<GiftPhotoChange>({ kind: 'keep' });
  const [preview, setPreview] = useState<string | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const initial = formForGift(item);
  const dirty =
    photo.kind !== 'keep' ||
    (Object.keys(form) as (keyof GiftForm)[]).some(
      (key) => form[key] !== initial[key],
    );
  const photoUri =
    photo.kind === 'remove' ? null : (preview ?? item?.photo_url ?? null);
  async function choose(source: PhotoSource) {
    setPhotoError(null);
    try {
      const picked = await pickPhoto(source);
      if (picked.kind === 'denied') {
        setPhotoError(permissionDeniedMessage(source));
        return;
      }
      if (picked.kind === 'cancelled') return;
      setPhoto({ kind: 'set', data: picked.data });
      setPreview(picked.uri);
      setPhotoOpen(false);
    } catch {
      setPhotoError('Não foi possível usar essa imagem. Tente outra foto.');
    }
  }
  function removePhoto() {
    setPhoto(item?.photo_url ? { kind: 'remove' } : { kind: 'keep' });
    setPreview(null);
    setPhotoOpen(false);
  }
  function change(key: keyof GiftForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setValidation(null);
  }
  function submit() {
    if (pending) return;
    const result = giftPayload(form);
    setValidation(result.error);
    if (result.payload) onSave(result.payload, photo);
  }
  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <DsBackHeader
            label="Minha lista"
            onPress={() => {
              if (!pending) onClose();
            }}
          />
          <View style={styles.hero}>
            <DsAvatar
              name={form.title || 'Presente'}
              size={88}
              photoUri={photoUri}
              fallback={<Gift size={40} color={tokens.colors.onPrimary} />}
              onEdit={() => {
                setPhotoError(null);
                setPhotoOpen(true);
              }}
              editLabel="Editar foto do presente"
            />
            <View style={styles.heroCopy}>
              <DsText
                accessibilityRole="header"
                role="title"
                style={styles.centered}
              >
                {item ? 'Editar presente' : 'Adicionar presente'}
              </DsText>
              <DsText role="caption" style={[styles.centered, styles.muted]}>
                {item
                  ? 'Atualize o que você gostaria de ganhar.'
                  : 'Conte o que você gostaria de ganhar.'}
              </DsText>
            </View>
          </View>
          <View style={styles.card}>
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
              label="Link *"
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
          </View>
          {(validation || error) && (
            <DsFeedback message={validation || error || ''} tone="error" />
          )}
        </ScrollView>
        <PhotoSheet
          visible={photoOpen}
          title="Foto do presente"
          name={form.title || 'Presente'}
          photoUri={photoUri}
          pending={false}
          error={photoError}
          onChoose={(source) => {
            void choose(source);
          }}
          onRemove={removePhoto}
          onClose={() => setPhotoOpen(false)}
        />
        <View style={styles.actions}>
          <DsButton
            label={
              pending ? 'Salvando...' : item ? 'Salvar' : 'Adicionar presente'
            }
            pending={pending}
            disabled={!!item && !dirty}
            onPress={submit}
          />
          {item && onDelete && (
            <DsButton
              label="Excluir presente"
              variant="destructive"
              icon={<Trash2 size={18} color={tokens.colors.danger} />}
              disabled={pending}
              onPress={() => setConfirming(true)}
            />
          )}
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
      </KeyboardAvoidingView>
    </View>
  );
};

// Slides in from the right like a pushed screen; the Modal only provides the
// full-screen layer above the tab bar.
export const GiftEditor = (props: GiftEditorProps) => {
  const { width } = useWindowDimensions();
  const offset = useRef(new Animated.Value(width)).current;
  useEffect(() => {
    Animated.timing(offset, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [offset]);
  const { onClose, pending } = props;
  const close = useCallback(() => {
    Animated.timing(offset, {
      toValue: width,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [offset, onClose, width]);
  return (
    <Modal
      animationType="none"
      transparent
      statusBarTranslucent
      visible
      onRequestClose={() => {
        if (!pending) close();
      }}
    >
      <SafeAreaProvider>
        <Animated.View
          style={[styles.fill, { transform: [{ translateX: offset }] }]}
        >
          <GiftEditorBody {...props} onClose={close} />
        </Animated.View>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.colors.background },
  fill: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
  },
  hero: { alignItems: 'center', gap: 12 },
  heroCopy: { alignSelf: 'stretch', gap: 4 },
  centered: { textAlign: 'center' },
  muted: { color: tokens.colors.textMuted },
  card: {
    padding: 16,
    gap: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  actions: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
});
