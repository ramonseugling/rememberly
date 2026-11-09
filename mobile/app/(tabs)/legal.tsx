import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink, FileText, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsBackHeader,
  DsFeedback,
  DsListCard,
  DsText,
  tokens,
} from '../../src/design-system';
import { LEGAL_LINKS } from '../../src/features/legal/links';

export default function LegalScreen() {
  const [error, setError] = useState<string | null>(null);

  async function open(url: string) {
    setError(null);
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      setError('Não foi possível abrir a página agora. Tente novamente.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <DsBackHeader
          label="Perfil"
          onPress={() => router.navigate('/(tabs)/profile')}
        />
        <View style={styles.header}>
          <DsText role="title">Termos e privacidade</DsText>
          <DsText role="caption" style={styles.muted}>
            Entenda como o Rememberly funciona e como cuidamos dos seus dados.
          </DsText>
        </View>
        {error && <DsFeedback tone="error" message={error} />}
        <DsListCard
          title="Termos de uso"
          subtitle="Regras para usar o aplicativo"
          icon={<FileText size={22} color={tokens.colors.brand} />}
          trailing={<ExternalLink size={18} color={tokens.colors.textMuted} />}
          onPress={() => void open(LEGAL_LINKS.terms)}
        />
        <DsListCard
          title="Política de privacidade"
          subtitle="Como tratamos e protegemos seus dados"
          icon={<ShieldCheck size={22} color={tokens.colors.brand} />}
          trailing={<ExternalLink size={18} color={tokens.colors.textMuted} />}
          onPress={() => void open(LEGAL_LINKS.privacy)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: tokens.tabBarClearance,
    gap: 12,
  },
  header: { gap: 6, marginBottom: 4 },
  muted: { color: tokens.colors.textMuted },
});
