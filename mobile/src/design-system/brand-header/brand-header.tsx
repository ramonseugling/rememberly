import { Image, StyleSheet, View } from 'react-native';
import { DsGradientText } from '../gradient-text/gradient-text';
import { tokens } from '../tokens';

export const DsBrandHeader = () => (
  <View
    accessible
    accessibilityRole="image"
    accessibilityLabel="Rememberly"
    style={styles.wrap}
  >
    <Image
      source={require('../../../assets/brand/new-3d-logo.png')}
      style={styles.logo}
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
  logo: { width: 88, height: 88 },
});
