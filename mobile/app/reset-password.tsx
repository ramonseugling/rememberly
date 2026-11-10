import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DsText, tokens } from '../src/design-system';
import { resetToken } from '../src/navigation/intents';
import { backToLogin } from '../src/features/auth/navigation';
import { passwordError } from '../src/features/auth/api';
import {
  AuthAction,
  AuthField,
  AuthLink,
  AuthPage,
  publicAuth,
  useAuthTask,
} from '../src/features/auth/ui';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const supplied = resetToken(params.token) ? params.token : '';
  const task = useAuthTask();
  const [token, setToken] = useState(supplied);
  const [linkToken, setLinkToken] = useState(!!supplied);
  const [manual, setManual] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [done, setDone] = useState(false);
  useFocusEffect(
    useCallback(
      () => () => {
        setToken('');
        setPassword('');
        setConfirmation('');
        setLinkToken(false);
        setManual(false);
        setDone(false);
      },
      [],
    ),
  );
  useEffect(() => {
    if (params.token === undefined) return;
    task.cancel();
    task.setMessage(null);
    setToken(supplied);
    setLinkToken(!!supplied);
    setManual(false);
    setDone(false);
    setPassword('');
    setConfirmation('');
    router.setParams({ token: undefined });
  }, [supplied, params.token, task.cancel, task.setMessage]);
  const showForm = linkToken || manual;
  return (
    <AuthPage
      title={
        done
          ? 'Senha atualizada!'
          : showForm
            ? 'Crie uma nova senha'
            : 'Link inválido'
      }
      subtitle={
        done
          ? 'Entre na sua conta usando a nova senha.'
          : showForm
            ? 'Escolha uma senha forte que você vai lembrar.'
            : 'Este link de redefinição é inválido ou expirou.'
      }
      pending={task.pending}
      message={task.message}
    >
      {done ? (
        <View style={styles.feedback}>
          <DsText accessible={false} style={styles.emoji}>
            ✅
          </DsText>
          <AuthAction
            label="Voltar para o login"
            onPress={() => backToLogin()}
          />
        </View>
      ) : !showForm ? (
        <View style={styles.feedback}>
          <DsText accessible={false} style={styles.emoji}>
            ⚠️
          </DsText>
          <DsText style={styles.text}>
            Solicite um novo link de redefinição.
          </DsText>
          <AuthAction
            label="Solicitar novo link"
            disabled={task.pending}
            onPress={() => router.replace('/forgot-password')}
          />
          <AuthLink
            label="Já tenho o código do link"
            disabled={task.pending}
            onPress={() => {
              setManual(true);
              task.setMessage(null);
            }}
          />
          <AuthLink
            label="Voltar para o login"
            disabled={task.pending}
            onPress={() => backToLogin()}
          />
        </View>
      ) : (
        <>
          {!linkToken && (
            <View style={styles.manual}>
              <DsText style={styles.manualText}>
                Cole o código que aparece após token= no link recebido por
                e-mail.
              </DsText>
              <AuthField
                label="Código de redefinição"
                value={token}
                onChangeText={(value) => {
                  setToken(value);
                  task.setMessage(null);
                }}
                editable={!task.pending}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="off"
                maxLength={96}
              />
            </View>
          )}
          <AuthField
            label="Nova senha"
            icon="password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            editable={!task.pending}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={72}
          />
          <AuthField
            label="Confirmar nova senha"
            icon="password"
            placeholder="••••••••"
            value={confirmation}
            onChangeText={setConfirmation}
            editable={!task.pending}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={72}
          />
          <AuthAction
            label="Salvar nova senha"
            pending={task.pending}
            onPress={() => {
              const error = !resetToken(token.trim())
                ? 'Informe um código de redefinição válido ou solicite um novo link.'
                : passwordError(password, confirmation);
              if (error) {
                task.setMessage(error);
                return;
              }
              void task.run(async (signal) => {
                await publicAuth.resetPassword(token.trim(), password, signal);
                if (signal.aborted) return;
                setToken('');
                setPassword('');
                setConfirmation('');
                setDone(true);
              });
            }}
          />
          {(task.message || manual) && (
            <>
              <AuthLink
                label="Solicitar novo link"
                disabled={task.pending}
                onPress={() => router.replace('/forgot-password')}
              />
              <AuthLink
                label="Voltar para o login"
                disabled={task.pending}
                onPress={() => backToLogin()}
              />
            </>
          )}
        </>
      )}
    </AuthPage>
  );
}

const styles = StyleSheet.create({
  feedback: { gap: 16 },
  emoji: { fontSize: 48, lineHeight: 64, textAlign: 'center' },
  text: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  manual: {
    backgroundColor: tokens.colors.background,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: 16,
  },
  manualText: { color: tokens.colors.textMuted, fontSize: 14, lineHeight: 20 },
});
