import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronRight, Gift, Plus, Share2, Users } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
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
import { ApiError, useAuthenticatedApi, useResource } from '../../data/hooks';
import type { ProfileUser } from '../account/forms';
import { BirthdayHero } from './birthday-hero';
import { GiftEditor } from './gift-editor';
import {
  birthdayCard,
  firstName,
  giftConflict,
  giftHost,
  purchasedMessage,
  reservedMessage,
  reservedTitle,
} from './model';
import type { GiftItem, GiftList, GiftPayload } from './model';
import { giftLink } from './link';
import { ShareSheet } from './share-sheet';
import { apiConfiguration } from '../../config/environment';

type Change =
  | { kind: 'save'; item?: GiftItem; payload: GiftPayload }
  | { kind: 'delete'; item: GiftItem };

function ActionPill({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && { opacity: 0.8 }]}
    >
      {icon}
      <DsText role="label" style={styles.pillLabel} numberOfLines={1}>
        {label}
      </DsText>
    </Pressable>
  );
}

export function GiftsScreen() {
  const list = useResource<GiftList>('/api/v1/gifts');
  const profile = useResource<{ user: ProfileUser }>('/api/v1/mobile/me');
  const [sharing, setSharing] = useState(false);
  const { request } = useAuthenticatedApi();
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
    const suffix = confirm ? '?confirm=true' : '';
    try {
      if (change.kind === 'delete') {
        await request(`/api/v1/gifts/${change.item.id}${suffix}`, {
          method: 'DELETE',
        });
      } else if (change.item) {
        await request(`/api/v1/gifts/${change.item.id}${suffix}`, {
          method: 'PATCH',
          body: change.payload,
        });
      } else {
        await request('/api/v1/gifts', {
          method: 'POST',
          body: change.payload,
        });
      }
      if (!mounted.current) return;
      setEditor(null);
      setReserved(null);
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
            refreshing={list.loading}
            onRefresh={() => {
              void list.reload();
              void profile.reload();
            }}
          />
        }
      >
        {ready && (
          <BirthdayHero
            name={firstName(user.name)}
            photoUri={user.avatar_url ?? null}
            card={card}
          />
        )}
        {ready && (
          <View style={styles.actions}>
            {!empty && (
              <ActionPill
                label="Compartilhar"
                icon={<Share2 size={18} color={tokens.colors.actionText} />}
                onPress={() => setSharing(true)}
              />
            )}
            <ActionPill
              label="Listas dos grupos"
              icon={<Users size={18} color={tokens.colors.actionText} />}
              onPress={() => router.navigate('/(tabs)/gifts-groups')}
            />
          </View>
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
        {empty && (
          <View style={styles.emptyCard}>
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
              <DsText role="caption" style={[styles.centered, styles.muted]}>
                Adicione o que você quer ganhar e compartilhe com seus grupos
                para ninguém errar no presente.
              </DsText>
            </View>
            <DsButton
              label="Adicionar meu primeiro presente"
              onPress={() => openEditor()}
              style={styles.stretch}
            />
          </View>
        )}
        {ready && !empty && !list.error && (
          <>
            <View style={styles.sectionRow}>
              <DsText
                accessibilityRole="header"
                role="section"
                style={styles.sectionTitle}
              >
                Minha lista de presentes
              </DsText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adicionar presente"
                accessibilityState={{ disabled: pending || full }}
                disabled={pending || full}
                onPress={() => openEditor()}
                style={{ opacity: pending || full ? 0.5 : 1 }}
              >
                <LinearGradient
                  colors={tokens.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButton}
                >
                  <Plus size={16} color={tokens.colors.onPrimary} />
                  <DsText role="label" style={styles.addLabel}>
                    Adicionar
                  </DsText>
                </LinearGradient>
              </Pressable>
            </View>
            {full && (
              <DsText role="caption" style={styles.muted}>
                Sua lista chegou ao limite de {limit} presentes.
              </DsText>
            )}
            <View style={styles.listCard}>
              {items.map((item, index) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  disabled={pending}
                  onPress={() => openEditor(item)}
                  style={[styles.itemRow, index > 0 && styles.itemDivider]}
                >
                  <View style={styles.itemIcon}>
                    <Gift size={20} color={tokens.colors.brand} />
                  </View>
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
            </View>
          </>
        )}
      </ScrollView>
      {sharing && user && (
        <ShareSheet
          link={giftLink(apiConfiguration.apiOrigin, user.id)}
          onClose={() => setSharing(false)}
        />
      )}
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
          onSave={(payload) => {
            void apply({ kind: 'save', item: editor.item, payload }, false);
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
    paddingTop: 24,
    paddingBottom: tokens.tabBarClearance,
    gap: 12,
  },
  stack: { gap: 12 },
  muted: { color: tokens.colors.textMuted },
  centered: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch' },
  emptyCard: {
    padding: 20,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.card,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: { gap: 6, alignItems: 'center' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: { flex: 1, fontSize: 17, lineHeight: 22 },
  addButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addLabel: { color: tokens.colors.onPrimary },
  actions: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
    backgroundColor: tokens.colors.iconSurface,
  },
  pillLabel: { color: tokens.colors.actionText, flexShrink: 1 },
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
  itemDivider: { borderTopWidth: 1, borderTopColor: tokens.colors.border },
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
