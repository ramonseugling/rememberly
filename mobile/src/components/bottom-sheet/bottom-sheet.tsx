import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Text } from '../brand-text/brand-text';
import {
  resolveAppearance,
  type ComponentAppearance,
  type ResolvedAppearance,
} from '../component-appearance';

interface BottomSheetProps {
  appearance?: ComponentAppearance;
  title: string;
  visible?: boolean;
  pending?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const BottomSheet = ({
  appearance,
  title,
  visible = true,
  pending = false,
  onClose,
  children,
}: BottomSheetProps) => {
  const theme = resolveAppearance(appearance);
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const panelHeight = useRef(height);
  const translation = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
      translation.stopAnimation();
      backdropOpacity.stopAnimation();
    };
  }, [translation, backdropOpacity]);
  useLayoutEffect(() => {
    if (visible) {
      translation.setValue(panelHeight.current);
      backdropOpacity.setValue(0);
    } else {
      translation.stopAnimation();
      backdropOpacity.stopAnimation();
    }
  }, [visible, translation, backdropOpacity]);
  const close = () => {
    if (!pending) onClose();
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
      onShow={() => {
        translation.setValue(panelHeight.current);
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: reduceMotion ? 0 : 180,
            useNativeDriver: true,
          }),
          Animated.timing(translation, {
            toValue: 0,
            duration: reduceMotion ? 0 : 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.backdrop,
            { opacity: backdropOpacity },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar painel"
          disabled={pending}
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          accessibilityViewIsModal
          onLayout={(event) => {
            panelHeight.current = event.nativeEvent.layout.height;
          }}
          style={[
            styles.panel,
            {
              maxHeight: height - insets.top - 24,
              transform: [{ translateY: translation }],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar painel"
              accessibilityState={{ disabled: pending }}
              disabled={pending}
              onPress={close}
              style={styles.close}
            >
              <X size={22} color={theme.colors.muted} />
            </Pressable>
          </View>
          <ScrollView
            style={{ flexGrow: 0, flexShrink: 1 }}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: ResolvedAppearance) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: { backgroundColor: 'rgba(36, 43, 92, 0.3)' },
    panel: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: theme.colors.border,
      width: '100%',
      alignSelf: 'center',
      maxWidth: 640,
      flexShrink: 1,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      marginTop: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 24,
      paddingRight: 12,
      paddingVertical: 10,
      gap: 8,
    },
    title: {
      flex: 1,
      fontFamily: theme.fonts.heading,
      fontSize: 22,
      color: theme.colors.foreground,
    },
    close: {
      minWidth: theme.controlMinHeight,
      minHeight: theme.controlMinHeight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
  });
