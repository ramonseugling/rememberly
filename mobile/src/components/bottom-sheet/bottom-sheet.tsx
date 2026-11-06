import type { ReactNode } from 'react';
import {
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
import { theme } from '../../theme';

interface BottomSheetProps {
  title: string;
  visible?: boolean;
  pending?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const BottomSheet = ({
  title,
  visible = true,
  pending = false,
  onClose,
  children,
}: BottomSheetProps) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const close = () => {
    if (!pending) onClose();
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar painel"
          disabled={pending}
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[styles.panel, { maxHeight: height - insets.top - 24 }]}
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(36, 43, 92, 0.3)',
  },
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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
});
