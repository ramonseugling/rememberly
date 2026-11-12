import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Gift, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsButton,
  DsConfirmSheet,
  DsFeedback,
  DsText,
  tokens,
} from '../../design-system';
import {
  ApiError,
  useAuthenticatedApi,
  usePullRefresh,
  useResource,
} from '../../data/hooks';
import type { ProfileUser } from '../account/forms';
import { BirthdayHero } from './birthday-hero';
import { GiftEditor } from './gift-editor';
import {
  birthdayCard,
  firstName,
  giftConflict,
  giftFieldsChanged,
  giftHost,
  purchasedMessage,
  reservedMessage,
  reservedTitle,
} from './model';
import type { GiftItem, GiftList, GiftPayload, GiftPhotoChange } from './model';
import { giftLink, whatsappUrl } from './link';
import { GiftThumb } from './gift-thumb';
import { PHOTO_CONTENT_TYPE } from '../photo/photo-rules';
import { apiConfiguration } from '../../config/environment';

type Change =
  | {
      kind: 'save';
      item?: GiftItem;
      payload: GiftPayload;
      photo: GiftPhotoChange;
    }
  | { kind: 'delete'; item: GiftItem };

export function GiftsScreen() {
  const list = useResource<GiftList>('/api/v1/gifts');
  const profile = useResource<{ user: ProfileUser }>('/api/v1/mobile/me');
  const { request } = useAuthenticatedApi();
  const pull = usePullRefresh();
  const [editor, setEditor] = useState<{ item?: GiftItem } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reserved, setReserved] = useState<Change | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function apply(change: Change, confirm: boolean) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    let photoFailed = false;
    const suffix = confirm ? '?confirm=true' : '';
    try {
      if (change.kind === 'delete') {
        await request(`/api/v1/gifts/${change.item.id}${suffix}`, {
          method: 'DELETE',
        });
      } else {
        let id = change.item?.id;
        if (!change.item || giftFieldsChanged(change.item, change.payload)) {
          if (change.item) {
            await request(`/api/v1/gifts/${change.item.id}${suffix}`, {
              method: 'PATCH',
              body: change.payload,
            });
          } else {
            const created = await request<GiftItem>('/api/v1/gifts', {
              method: 'POST',
              body: change.payload,
            });
            id = created.id;
          }
        }
        if (id && change.photo.kind !== 'keep') {
          try {
            if (change.photo.kind === 'set')
              await request(`/api/v1/gifts/${id}/photo`, {
                method: 'PUT',
                rawBody: {
                  data: change.photo.data,
                  contentType: PHOTO_CONTENT_TYPE,
                },
              });
            else
              await request(`/api/v1/gifts/${id}/photo`, { method: 'DELETE' });
          } catch {
            photoFailed = true;
          }
        }
      }
      if (!mounted.current) return;
      setEditor(null);
      setReserved(null);
      if (photoFailed)
        setError(
          'O presente foi salvo, mas não foi possível salvar a foto. Edite o presente para tentar de novo.',
        );
      await list.reload();
    } catch (caught) {
      if (!mounted.current) return;
      const conflict = giftConflict(caught);
      if (conflict === 'reserved' && !confirm) {
        setReserved(change);
      } else if (conflict === 'purchased') {
        setReserved(null);
        setError(purchasedMessage);
      } else {
        setReserved(null);
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Não foi possível salvar. Tente novamente.',
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  const items = list.data?.items ?? [];
  const limit = list.data?.limit ?? 50;
  const user = profile.data?.user;
  async function shareOnWhatsApp() {
    if (!user) return;
    try {
      const { token } = await request<{ token: string }>(
        '/api/v1/gifts/share-link',
      );
      const urls = whatsappUrl(
        giftLink(apiConfiguration.apiOrigin, token),
        card?.days ?? null,
      );
      await Linking.openURL(urls.app).catch(() => Linking.openURL(urls.web));
    } catch {
      setError('Não foi possível abrir o WhatsApp.');
    }
  }

  const card = user
    ? birthdayCard(
        user.birth_day,
        user.birth_month,
        user.birth_year,
        new Date(),
      )
    : null;
  const ready = !!list.data && !!user;
  const empty = !!list.data && !list.error && items.length === 0;
  const full = items.length >= limit;
  const openEditor = (item?: GiftItem) => {
    setError(null);
    setEditor({ item });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
            refreshing={pull.refreshing}
            onRefresh={() => {
              pull.run(() => Promise.all([list.reload(), profile.reload()]));
            }}
          />
        }
      >
        {ready && (
          <BirthdayHero
            name={firstName(user.name)}
            photoUri={user.avatar_url ?? null}
            card={card}
            onShare={
              empty
                ? undefined
                : () => {
                    void shareOnWhatsApp();
                  }
            }
          >
            {!empty && !list.error && (
              <>
                <DsText
                  accessibilityRole="header"
                  role="section"
                  style={styles.sectionTitle}
                >
                  Minha lista de presentes
                </DsText>
                {full && (
                  <DsText role="caption" style={styles.muted}>
                    Sua lista chegou ao limite de {limit} presentes.
                  </DsText>
                )}
                <View style={styles.listCard}>
                  {items.map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={item.title}
                      disabled={pending}
                      onPress={() => openEditor(item)}
                      style={[styles.itemRow, styles.itemDivider]}
                    >
                      <GiftThumb uri={item.photo_url} size={40} />
                      <View style={styles.itemCopy}>
                        <DsText role="label">{item.title}</DsText>
                        {(item.description || item.link) && (
                          <DsText role="caption" style={styles.muted}>
                            {item.description ?? giftHost(item.link ?? '')}
                          </DsText>
                        )}
                      </View>
                      <ChevronRight size={18} color={tokens.colors.textMuted} />
                    </Pressable>
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Adicionar presente"
                    accessibilityState={{ disabled: pending || full }}
                    disabled={pending || full}
                    onPress={() => openEditor()}
                    style={[
                      styles.itemRow,
                      { opacity: pending || full ? 0.5 : 1 },
                    ]}
                  >
                    <LinearGradient
                      colors={tokens.actionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.itemIcon}
                    >
                      <Plus size={20} color={tokens.colors.onPrimary} />
                    </LinearGradient>
                    <View style={styles.itemCopy}>
                      <DsText role="label" style={styles.addLabel}>
                        Adicionar presente
                      </DsText>
                    </View>
                    <ChevronRight size={18} color={tokens.colors.textMuted} />
                  </Pressable>
                </View>
              </>
            )}
            {empty && (
              <View style={styles.emptyInvite}>
                <LinearGradient
                  colors={tokens.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyIcon}
                >
                  <Gift size={28} color={tokens.colors.onPrimary} />
                </LinearGradient>
                <View style={styles.emptyCopy}>
                  <DsText role="section" style={styles.centered}>
                    Sua lista de presentes
                  </DsText>
                  <DsText
                    role="caption"
                    style={[styles.centered, styles.muted]}
                  >
                    Adicione o que você quer ganhar e compartilhe o link com
                    quem quiser para ninguém errar no presente.
                  </DsText>
                </View>
                <DsButton
                  label="Adicionar meu primeiro presente"
                  onPress={() => openEditor()}
                  style={styles.stretch}
                />
              </View>
            )}
          </BirthdayHero>
        )}
        {list.loading && !list.data && (
          <ActivityIndicator
            accessibilityLabel="Carregando presentes"
            color={tokens.colors.primary}
          />
        )}
        {(list.error || (!editor && error)) && (
          <View style={styles.stack}>
            <DsFeedback tone="error" message={list.error || error || ''} />
            {list.error && (
              <DsButton
                variant="outline"
                label="Tentar novamente"
                onPress={() => {
                  void list.reload();
                }}
              />
            )}
          </View>
        )}
      </ScrollView>
      {editor && (
        <GiftEditor
          item={editor.item}
          pending={pending}
          error={error}
          onClose={() => {
            if (!busy.current) {
              setEditor(null);
              setError(null);
            }
          }}
          onDelete={
            editor.item
              ? () => {
                  if (editor.item)
                    void apply({ kind: 'delete', item: editor.item }, false);
                }
              : undefined
          }
          onSave={(payload, photo) => {
            void apply(
              { kind: 'save', item: editor.item, payload, photo },
              false,
            );
          }}
        />
      )}
      <DsConfirmSheet
        visible={!!reserved}
        title={reservedTitle}
        message={reservedMessage}
        confirmLabel="Continuar mesmo assim"
        pending={pending}
        onCancel={() => setReserved(null)}
        onConfirm={() => {
          if (reserved) void apply(reserved, true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: tokens.tabBarClearance,
    gap: 12,
  },
  stack: { gap: 12 },
  muted: { color: tokens.colors.textMuted },
  centered: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch' },
  emptyInvite: {
    marginTop: 4,
    paddingTop: 20,
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: { gap: 6, alignItems: 'center' },
  sectionTitle: { fontSize: 17, lineHeight: 22 },
  addLabel: { color: tokens.colors.brand },
  listCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
    overflow: 'hidden',
  },
  itemRow: {
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.iconSurface,
  },
  itemCopy: { flex: 1, minWidth: 0 },
});
