import { BottomSheet } from '../../components/bottom-sheet/bottom-sheet';
import { BrandButton } from '../../components/brand-button/brand-button';
import { Text } from '../../components/brand-text/brand-text';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ApiError, useAuthenticatedApi } from '../../data/hooks';
import { useSession } from '../../session/provider';
import { theme } from '../../theme';
import {
  canDeleteAccount,
  createDeletionConfirmation,
} from './deletion-confirmation';

export function DeleteAccount() {
  const { controller, state } = useSession();
  const { request } = useAuthenticatedApi();
  const scope = state.status === 'authenticated' ? state.identity : null;
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputs = useRef({ password: '', confirmation: '' });
  const focused = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  const gate = useRef(createDeletionConfirmation<typeof scope>());

  const clearInputs = useCallback(() => {
    inputs.current = { password: '', confirmation: '' };
    setPassword('');
    setConfirmation('');
  }, []);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setMessage(null);
      return () => {
        focused.current = false;
        setOpen(false);
        gate.current.invalidate();
        activeRequest.current?.abort();
        activeRequest.current = null;
        clearInputs();
        setPending(false);
      };
    }, [scope, clearInputs]),
  );

  function currentScope() {
    const snapshot = controller.getSnapshot();
    return snapshot.status === 'authenticated' ? snapshot.identity : null;
  }

  async function removeAccount(ticket: object) {
    if (
      !focused.current ||
      !scope ||
      !gate.current.submit(ticket, currentScope())
    )
      return;
    if (
      !canDeleteAccount(inputs.current.password, inputs.current.confirmation)
    ) {
      gate.current.invalidate();
      clearInputs();
      setPending(false);
      return;
    }
    const body = { password: inputs.current.password, confirmation: 'DELETE' };
    clearInputs();
    const abort = new AbortController();
    activeRequest.current = abort;
    try {
      await request('/api/v1/mobile/me', {
        method: 'DELETE',
        body,
        signal: abort.signal,
      });
      if (
        focused.current &&
        !abort.signal.aborted &&
        gate.current.current(ticket, currentScope())
      ) {
        await controller.logout();
      }
    } catch (cause) {
      if (
        focused.current &&
        !abort.signal.aborted &&
        gate.current.current(ticket, currentScope())
      ) {
        setMessage(
          cause instanceof ApiError && cause.status === 403
            ? 'Não foi possível confirmar sua senha atual. Digite-a novamente. Esta ação exige uma conta com senha.'
            : cause instanceof ApiError && cause.status === 409
              ? 'Você é responsável por um ou mais grupos. Exclua seus grupos antes de excluir a conta. Sua conta não foi excluída.'
              : cause instanceof ApiError
                ? cause.message
                : 'Não foi possível excluir sua conta. Tente novamente.',
        );
      }
    } finally {
      // An older request must not release a newer account's pending operation.
      if (activeRequest.current === abort) {
        activeRequest.current = null;
        gate.current.invalidate();
        setPending(false);
      }
    }
  }

  function confirm() {
    if (
      !focused.current ||
      !scope ||
      currentScope() !== scope ||
      !canDeleteAccount(inputs.current.password, inputs.current.confirmation)
    )
      return;
    const ticket = gate.current.open(scope);
    if (!ticket) return;
    setPending(true);
    setMessage(null);
    const cancel = () => {
      if (!gate.current.current(ticket, currentScope())) return;
      if (!gate.current.cancel(ticket)) return;
      clearInputs();
      setPending(false);
    };
    Alert.alert(
      'Excluir sua conta permanentemente?',
      'Sua conta, seus dados pessoais e suas participações em grupos serão excluídos permanentemente. Esta ação não pode ser desfeita. Exclua primeiro os grupos que você criou.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: cancel },
        {
          text: 'Excluir conta permanentemente',
          style: 'destructive',
          onPress: () => void removeAccount(ticket),
        },
      ],
      { cancelable: true, onDismiss: cancel },
    );
  }

  const disabled = pending || !canDeleteAccount(password, confirmation);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Excluir conta"
        onPress={() => {
          setMessage(null);
          setOpen(true);
        }}
        style={styles.link}
      >
        <Text style={styles.linkText}>Excluir conta</Text>
      </Pressable>
      <BottomSheet
        title="Excluir conta"
        visible={open}
        pending={pending}
        onClose={() => {
          gate.current.invalidate();
          clearInputs();
          setMessage(null);
          setOpen(false);
        }}
      >
        <View style={styles.section}>
          <Text style={styles.text}>
            Exclua permanentemente sua conta, seus dados pessoais e suas
            participações em grupos. Esta ação não pode ser desfeita. Antes,
            exclua os grupos que você criou.
          </Text>
          <Text style={styles.hint}>
            Informe sua senha atual e digite DELETE exatamente para continuar.
          </Text>
          <TextInput
            accessibilityLabel="Senha atual para excluir sua conta"
            value={password}
            onChangeText={(value) => {
              inputs.current.password = value;
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
          />
          <TextInput
            accessibilityLabel="Digite DELETE para confirmar a exclusão da conta"
            value={confirmation}
            onChangeText={(value) => {
              inputs.current.confirmation = value;
              setConfirmation(value);
              setMessage(null);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!pending}
            placeholder="Digite DELETE"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={confirm}
          />
          <BrandButton
            label={
              pending ? 'Excluindo conta...' : 'Excluir conta permanentemente'
            }
            variant="destructive"
            disabled={disabled}
            pending={pending}
            onPress={confirm}
          />
          {message && (
            <Text accessibilityRole="alert" style={styles.text}>
              {message}
            </Text>
          )}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
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
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: {
    fontSize: 14,
    color: theme.colors.destructive,
    textDecorationLine: 'underline',
  },
});
