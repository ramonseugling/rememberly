import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ApiError, useAuthenticatedApi } from '../../data/hooks';
import {
  DsButton,
  DsConfirmSheet,
  DsFeedback,
  DsField,
  DsSheet,
  DsText,
  tokens,
} from '../../design-system';
import { useSession } from '../../session/provider';
import {
  DELETION_PHRASE,
  canDeleteAccount,
  createDeletionConfirmation,
  deletionBody,
  deletionErrorMessage,
} from './deletion-confirmation';
import type { DeletionMode } from './deletion-confirmation';

interface DeleteAccountSheetProps {
  visible: boolean;
  hasPassword: boolean;
  email: string;
  onClose: () => void;
}

export const DeleteAccountSheet = ({
  visible,
  hasPassword,
  email,
  onClose,
}: DeleteAccountSheetProps) => {
  const { controller, state } = useSession();
  const { request } = useAuthenticatedApi();
  const scope = state.status === 'authenticated' ? state.identity : null;
  const [mode, setMode] = useState<DeletionMode>(
    hasPassword ? 'password' : 'code',
  );
  const [secret, setSecret] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [blockedByGroups, setBlockedByGroups] = useState(false);
  const inputs = useRef({ secret: '', confirmation: '' });
  const focused = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  const ticketRef = useRef<object | null>(null);
  const gate = useRef(createDeletionConfirmation<typeof scope>());

  const clearInputs = useCallback(() => {
    inputs.current = { secret: '', confirmation: '' };
    setSecret('');
    setConfirmation('');
  }, []);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setMessage(null);
      return () => {
        focused.current = false;
        setAsking(false);
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

  function reset() {
    gate.current.invalidate();
    ticketRef.current = null;
    clearInputs();
    setMessage(null);
    setBlockedByGroups(false);
    setAsking(false);
    setCodeSent(false);
    setMode(hasPassword ? 'password' : 'code');
  }

  function close() {
    reset();
    onClose();
  }

  async function sendCode() {
    if (sending || pending) return;
    setSending(true);
    setMessage(null);
    try {
      await request('/api/v1/mobile/me/deletion-code', { method: 'POST' });
      if (focused.current) setCodeSent(true);
    } catch (cause) {
      if (focused.current)
        setMessage(
          cause instanceof ApiError && cause.status === 429
            ? deletionErrorMessage(429, 'code')
            : 'Não foi possível enviar o código agora. Tente novamente.',
        );
    } finally {
      if (focused.current) setSending(false);
    }
  }

  async function removeAccount(ticket: object) {
    if (
      !focused.current ||
      !scope ||
      !gate.current.submit(ticket, currentScope())
    )
      return;
    const credential = { mode, value: inputs.current.secret };
    if (!canDeleteAccount(credential, inputs.current.confirmation)) {
      gate.current.invalidate();
      clearInputs();
      setPending(false);
      return;
    }
    const body = deletionBody(credential);
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
        const status = cause instanceof ApiError ? cause.status : undefined;
        setBlockedByGroups(status === 409);
        setMessage(deletionErrorMessage(status, mode));
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

  function askToConfirm() {
    if (
      !focused.current ||
      !scope ||
      currentScope() !== scope ||
      !canDeleteAccount(
        { mode, value: inputs.current.secret },
        inputs.current.confirmation,
      )
    )
      return;
    const ticket = gate.current.open(scope);
    if (!ticket) return;
    ticketRef.current = ticket;
    setPending(true);
    setMessage(null);
    setAsking(true);
  }

  function cancelAsk() {
    const ticket = ticketRef.current;
    setAsking(false);
    if (!ticket || !gate.current.current(ticket, currentScope())) return;
    if (!gate.current.cancel(ticket)) return;
    clearInputs();
    setPending(false);
  }

  const credential = { mode, value: secret };
  const disabled = pending || !canDeleteAccount(credential, confirmation);

  return (
    <DsSheet
      visible={visible}
      title="Excluir conta"
      pending={pending}
      onClose={close}
    >
      <DsText style={styles.muted}>
        Exclua permanentemente sua conta, seus dados pessoais e suas
        participações em grupos. Esta ação não pode ser desfeita. Antes, exclua
        os grupos que você criou.
      </DsText>
      <View style={styles.notice}>
        <DsText role="caption" style={styles.noticeText}>
          {mode === 'password'
            ? `Informe sua senha atual e digite "${DELETION_PHRASE}" para continuar.`
            : `Peça o código enviado para ${email} e digite "${DELETION_PHRASE}" para continuar.`}
        </DsText>
      </View>
      {mode === 'password' ? (
        <DsField
          label="Senha atual"
          accessibilityLabel="Senha atual para excluir sua conta"
          placeholder="Senha atual"
          value={secret}
          onChangeText={(value) => {
            inputs.current.secret = value;
            setSecret(value);
            setMessage(null);
          }}
          secureTextEntry
          textContentType="password"
          autoComplete="current-password"
          autoCapitalize="none"
          editable={!pending}
        />
      ) : (
        <View style={styles.codeBlock}>
          <DsButton
            label={codeSent ? 'Enviar novo código' : 'Enviar código por e-mail'}
            variant="outline"
            pending={sending}
            disabled={pending}
            onPress={() => {
              void sendCode();
            }}
          />
          {codeSent && (
            <DsText role="caption" style={styles.muted}>
              Enviamos um código de 6 dígitos para {email}. Ele vale por 10
              minutos.
            </DsText>
          )}
          <DsField
            label="Código de confirmação"
            accessibilityLabel="Código de 6 dígitos enviado por e-mail"
            placeholder="000000"
            value={secret}
            onChangeText={(value) => {
              const digits = value.replace(/[^0-9]/g, '').slice(0, 6);
              inputs.current.secret = digits;
              setSecret(digits);
              setMessage(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
            editable={!pending}
          />
        </View>
      )}
      {hasPassword && (
        <DsButton
          variant="text"
          label={
            mode === 'password' ? 'Usar código por e-mail' : 'Usar minha senha'
          }
          disabled={pending}
          onPress={() => {
            inputs.current.secret = '';
            setSecret('');
            setMessage(null);
            setMode(mode === 'password' ? 'code' : 'password');
          }}
        />
      )}
      <DsField
        label="Confirmação"
        accessibilityLabel={`Digite ${DELETION_PHRASE} para confirmar`}
        placeholder={`Digite: ${DELETION_PHRASE}`}
        value={confirmation}
        onChangeText={(value) => {
          inputs.current.confirmation = value;
          setConfirmation(value);
          setMessage(null);
        }}
        autoCapitalize="none"
        editable={!pending}
      />
      {message && <DsFeedback tone="error" message={message} />}
      {blockedByGroups && (
        <DsButton
          label="Ver meus grupos"
          variant="outline"
          onPress={() => {
            close();
            router.navigate('/(tabs)/groups');
          }}
        />
      )}
      <DsButton
        label="Excluir conta permanentemente"
        variant="destructive"
        pending={pending}
        disabled={disabled}
        onPress={askToConfirm}
      />
      <DsConfirmSheet
        visible={asking}
        title="Excluir sua conta permanentemente?"
        message="Sua conta, seus dados pessoais e suas participações em grupos serão excluídos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir conta permanentemente"
        pending={false}
        onCancel={cancelAsk}
        onConfirm={() => {
          const ticket = ticketRef.current;
          setAsking(false);
          if (ticket) void removeAccount(ticket);
        }}
      />
    </DsSheet>
  );
};

const styles = StyleSheet.create({
  muted: { color: tokens.colors.textMuted },
  notice: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: tokens.colors.dangerSurface,
  },
  noticeText: {
    color: tokens.colors.danger,
    fontFamily: tokens.fonts.bold,
    fontWeight: '600',
  },
  codeBlock: { gap: 8 },
});
