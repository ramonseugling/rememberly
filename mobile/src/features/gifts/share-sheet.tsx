import * as Clipboard from 'expo-clipboard';
import { Link2, MessageCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { DsFeedback, DsSheet, DsText, tokens } from '../../design-system';
import { whatsappUrl } from './link';

interface ShareSheetProps {
  link: string;
  onClose: () => void;
}

export const ShareSheet = ({ link, onClose }: ShareSheetProps) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function openWhatsApp() {
    const message = whatsappUrl(link);
    setError(null);
    void Linking.openURL(message.app).catch(() =>
      Linking.openURL(message.web).catch(() =>
        setError('Não foi possível abrir o WhatsApp.'),
      ),
    );
  }

  function copy() {
    setError(null);
    void Clipboard.setStringAsync(link)
      .then(() => {
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => setError('Não foi possível copiar o link.'));
  }

  return (
    <DsSheet title="Compartilhar lista" onClose={onClose}>
      <DsText role="caption" style={styles.muted}>
        Todas as pessoas que estão em algum grupo com você já veem a sua lista.
        Envie o link para abrir a lista direto no app. Só quem está em um grupo
        com você consegue abrir.
      </DsText>
      {error && <DsFeedback tone="error" message={error} />}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar pelo WhatsApp"
          onPress={openWhatsApp}
          style={[styles.button, styles.whatsapp]}
        >
          <MessageCircle size={18} color={tokens.colors.success} />
          <DsText role="label" style={styles.whatsappLabel}>
            WhatsApp
          </DsText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copiar link"
          onPress={copy}
          style={[styles.button, styles.copy]}
        >
          <Link2 size={18} color={tokens.colors.actionText} />
          <DsText role="label" style={styles.copyLabel}>
            {copied ? 'Link copiado' : 'Copiar link'}
          </DsText>
        </Pressable>
      </View>
    </DsSheet>
  );
};

const styles = StyleSheet.create({
  muted: { color: tokens.colors.textMuted },
  actions: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  whatsapp: { backgroundColor: tokens.colors.successSurface },
  whatsappLabel: { color: tokens.colors.success },
  copy: { backgroundColor: tokens.colors.iconSurface },
  copyLabel: { color: tokens.colors.actionText },
});
