import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../brand-text/brand-text';
import { theme } from '../../theme';
import { otpCode } from '../../features/auth/signup-presentation';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const OtpInput = ({
  value,
  onChange,
  disabled = false,
}: OtpInputProps) => {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessible={false}
      onPress={() => input.current?.focus()}
      disabled={disabled}
      style={styles.container}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.digits}
      >
        {Array.from({ length: 6 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.box,
              focused && index === Math.min(value.length, 5) && styles.active,
              disabled && styles.disabled,
            ]}
          >
            <Text style={styles.digit}>{value[index] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={input}
        accessibilityLabel="Código de verificação de 6 dígitos"
        accessibilityHint="Digite ou cole o código enviado por e-mail"
        value={value}
        onChangeText={(text) => onChange(otpCode(text))}
        editable={!disabled}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        autoFocus
        textContentType="oneTimeCode"
        autoCorrect={false}
        autoCapitalize="none"
        maxLength={32}
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
        selectionColor="transparent"
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', position: 'relative' },
  digits: { flexDirection: 'row', gap: 8 },
  box: {
    flex: 1,
    minHeight: 56,
    minWidth: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  active: { borderColor: theme.colors.primary, borderWidth: 2 },
  disabled: { opacity: 0.5 },
  digit: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.foreground,
  },
  input: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.02,
    color: 'transparent',
    fontSize: 22,
  },
});
