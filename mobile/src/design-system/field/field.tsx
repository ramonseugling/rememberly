import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

interface DsFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
}

export const DsField = ({
  label,
  hint,
  error,
  style,
  secureTextEntry,
  editable = true,
  onFocus,
  onBlur,
  ...props
}: DsFieldProps) => {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      {label && <DsText role="label">{label}</DsText>}
      <View
        style={[
          styles.control,
          focused && styles.focused,
          !!error && styles.errorBorder,
          !editable && styles.disabled,
        ]}
      >
        <TextInput
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          accessibilityHint={error || hint || props.accessibilityHint}
          editable={editable}
          secureTextEntry={!!secureTextEntry && !visible}
          placeholderTextColor={tokens.colors.textMuted}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, style]}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
            disabled={!editable}
            onPress={() => setVisible((current) => !current)}
            style={styles.eye}
          >
            {visible ? (
              <EyeOff size={20} color={tokens.colors.textMuted} />
            ) : (
              <Eye size={20} color={tokens.colors.textMuted} />
            )}
          </Pressable>
        )}
      </View>
      {error ? (
        <View style={styles.feedback}>
          <AlertCircle
            accessible={false}
            size={16}
            color={tokens.colors.danger}
          />
          <DsText
            accessibilityRole="alert"
            role="caption"
            style={styles.errorText}
          >
            {error}
          </DsText>
        </View>
      ) : hint ? (
        <DsText role="caption" style={{ color: tokens.colors.textMuted }}>
          {hint}
        </DsText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: { gap: 6 },
  control: {
    borderRadius: tokens.radius.control,
    borderWidth: 1,
    borderColor: tokens.colors.controlBorder,
    backgroundColor: tokens.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: tokens.controlMinHeight,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: tokens.controlMinHeight - 2,
    paddingVertical: 12,
    paddingHorizontal: 0,
    ...tokens.typography.body,
    fontFamily: tokens.fonts.body,
    color: tokens.colors.text,
  },
  focused: {
    borderColor: tokens.colors.primary,
    outlineColor: tokens.colors.primary,
    outlineWidth: 1,
    outlineOffset: 1,
  },
  errorBorder: { borderColor: tokens.colors.danger },
  disabled: { backgroundColor: tokens.colors.surfaceMuted },
  eye: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -10,
  },
  feedback: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  errorText: { color: tokens.colors.danger, flex: 1 },
});
