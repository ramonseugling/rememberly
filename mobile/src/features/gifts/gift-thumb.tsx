import { Gift } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';
import { tokens } from '../../design-system';

export const GiftThumb = ({
  uri,
  size = 44,
}: {
  uri?: string | null;
  size?: number;
}) =>
  uri ? (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  ) : (
    <View
      style={[
        styles.icon,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Gift size={Math.round(size * 0.5)} color={tokens.colors.brand} />
    </View>
  );

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.iconSurface,
  },
});
