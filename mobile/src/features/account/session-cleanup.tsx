import { BrandButton } from '../../components/brand-button/brand-button';
import { Text } from '../../components/brand-text/brand-text';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { ApiError, useAuthenticatedApi } from '../../data/hooks';
import { theme } from '../../theme';

export function SessionCleanup() {
  const { request } = useAuthenticatedApi();
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const passwordRef = useRef('');
  const focused = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);

  const clearPassword = useCallback(() => {
    passwordRef.current = '';
    setPassword('');
  }, []);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        clearPassword();
        activeRequest.current?.abort();
        activeRequest.current = null;
        setPending(false);
      };
    }, [clearPassword]),
  );

  async function revokeOthers() {
    if (!focused.current || activeRequest.current || !passwordRef.current)
      return;
    const confirmation = passwordRef.current;
    clearPassword();
    const abort = new AbortController();
    activeRequest.current = abort;
    setPending(true);
    setMessage(null);
    try {
      await request('/api/v1/mobile/sessions/others', {
        method: 'DELETE',
        body: { password: confirmation },
        signal: abort.signal,
      });
      if (focused.current && !abort.signal.aborted) {
        setMessage(
          'As outras sessões foram encerradas. Você continua conectado neste dispositivo.',
        );
      }
    } catch (cause) {
      if (focused.current && !abort.signal.aborted) {
        setMessage(
          cause instanceof ApiError && cause.status === 403
            ? 'Não foi possível confirmar sua senha. Digite sua senha atual novamente. Esta ação exige uma conta com senha.'
            : cause instanceof ApiError
              ? cause.message
              : 'Não foi possível encerrar as outras sessões. Tente novamente.',
        );
      }
    } finally {
      if (activeRequest.current === abort) {
        activeRequest.current = null;
        setPending(false);
      }
    }
  }

  function confirm() {
    if (!focused.current || activeRequest.current || !passwordRef.current)
      return;
    Alert.alert(
      'Encerrar outras sessões?',
      'Você será desconectado dos outros dispositivos. Sua sessão atual continuará ativa.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: clearPassword },
        {
          text: 'Encerrar outras sessões',
          style: 'destructive',
          onPress: () => void revokeOthers(),
        },
      ],
      { cancelable: true, onDismiss: clearPassword },
    );
  }

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.label}>
        Segurança da conta
      </Text>
      <Text style={styles.text}>
        Perdeu acesso a outro celular ou computador? Encerre suas outras sessões
        do Rememberly.
      </Text>
      <Text style={styles.hint}>
        Confirme sua senha atual. Esta ação exige uma conta com senha.
      </Text>
      <TextInput
        accessibilityLabel="Senha atual para encerrar outras sessões"
        value={password}
        onChangeText={(value) => {
          passwordRef.current = value;
          setPassword(value);
          setMessage(null);
        }}
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!pending}
        placeholder="Senha atual"
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={confirm}
      />
      <BrandButton
        label={pending ? 'Encerrando sessões...' : 'Encerrar outras sessões'}
        variant="outline"
        disabled={pending || !password}
        pending={pending}
        onPress={confirm}
      />
      {message && (
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
  },
  label: {
    fontSize: 16,
    color: theme.colors.foreground,
    fontFamily: theme.fonts.heading,
  },
  text: { fontSize: 14, color: theme.colors.muted, lineHeight: 21 },
  hint: { fontSize: 12, color: theme.colors.muted, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.foreground,
  },
});
