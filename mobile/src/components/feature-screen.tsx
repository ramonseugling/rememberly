import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

interface FeatureScreenProps {
  title: string;
  description: string;
  unavailable: string;
}

export function FeatureScreen({
  title,
  description,
  unavailable,
}: FeatureScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>Rememberly</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Coming soon</Text>
          <Text style={styles.description}>{unavailable}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.large, gap: theme.spacing.medium },
  brand: { color: theme.colors.primary, fontSize: 18, fontWeight: '700' },
  title: { color: theme.colors.foreground, fontSize: 32, fontWeight: '700' },
  description: { color: theme.colors.muted, fontSize: 17, lineHeight: 26 },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.spacing.large,
    gap: theme.spacing.small,
  },
  cardTitle: {
    color: theme.colors.foreground,
    fontSize: 20,
    fontWeight: '600',
  },
});
