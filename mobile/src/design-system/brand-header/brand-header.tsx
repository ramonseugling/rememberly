import { Image, StyleSheet, View } from 'react-native';
import { DsGradientText } from '../gradient-text/gradient-text';
import { tokens } from '../tokens';

interface DsBrandHeaderProps {
  compact?: boolean;
}

export const DsBrandHeader = ({ compact }: DsBrandHeaderProps) => (
  <View
    accessible
    accessibilityRole="image"
    accessibilityLabel="Rememberly"
    style={[styles.wrap, compact && styles.compactWrap]}
  >
    <Image
      source={require('../../../assets/brand/new-3d-logo.png')}
      style={compact ? styles.logoCompact : styles.logo}
      resizeMode="contain"
    />
    <DsGradientText
      style={{
        fontFamily: tokens.fonts.headingBold,
        fontWeight: '700',
        fontSize: 28,
        lineHeight: 34,
      }}
    >
      Rememberly
    </DsGradientText>
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  compactWrap: { gap: 4 },
  logo: { width: 88, height: 88 },
  logoCompact: { width: 56, height: 56 },
});
