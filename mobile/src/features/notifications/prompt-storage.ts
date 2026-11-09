import * as SecureStore from 'expo-secure-store';
import { apiConfiguration } from '../../config/environment';
import { parseDismissedAt, promptStorageKey } from './prompt-rules';

function keyFor(userId: string) {
  return promptStorageKey(
    apiConfiguration.environment,
    apiConfiguration.apiOrigin,
    userId,
  );
}

export async function readPromptDismissedAt(userId: string) {
  try {
    return parseDismissedAt(await SecureStore.getItemAsync(keyFor(userId)));
  } catch {
    return null;
  }
}

export async function writePromptDismissedAt(userId: string, at: number) {
  try {
    await SecureStore.setItemAsync(keyFor(userId), String(at), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // Failing to remember the choice only means the prompt may reappear.
  }
}
