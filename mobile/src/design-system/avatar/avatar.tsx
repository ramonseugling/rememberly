import { LinearGradient } from 'expo-linear-gradient';
import { Pencil } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';
import { initialOf } from './initial';

interface DsAvatarProps {
  name: string;
  size?: number;
  photoUri?: string | null;
  source?: ImageSourcePropType;
  fallback?: ReactNode;
  background?: string;
  onEdit?: () => void;
  editLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const DsAvatar = ({
  name,
  size = 48,
  photoUri,
  source,
  fallback,
  background,
  onEdit,
  editLabel = 'Editar foto',
  style,
}: DsAvatarProps) => {
  const badge = Math.max(24, Math.round(size * 0.32));
  const circle = [
    styles.circle,
    { width: size, height: size, borderRadius: size / 2 },
  ];
  const hidden = {
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  } as const;
  const content =
    source || photoUri ? (
      <Image
        source={source ?? { uri: photoUri! }}
        style={{ width: size, height: size }}
      />
    ) : (
      (fallback ?? (
        <DsText
          style={{
            color: tokens.colors.onPrimary,
            fontFamily: tokens.fonts.headingBold,
            fontWeight: '700',
            fontSize: Math.round(size * 0.4),
            lineHeight: Math.round(size * 0.5),
          }}
        >
          {initialOf(name)}
        </DsText>
      ))
    );
  return (
    <View style={[{ width: size, height: size }, style]}>
      {background ? (
        <View {...hidden} style={[circle, { backgroundColor: background }]}>
          {content}
        </View>
      ) : (
        <LinearGradient
          {...hidden}
          colors={tokens.actionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={circle}
        >
          {content}
        </LinearGradient>
      )}
      {onEdit && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editLabel}
          hitSlop={12}
          onPress={onEdit}
          style={[
            styles.edit,
            { width: badge, height: badge, borderRadius: badge / 2 },
          ]}
        >
          <Pencil size={Math.round(badge * 0.5)} color={tokens.colors.brand} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  edit: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
});
