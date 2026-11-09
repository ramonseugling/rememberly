import * as SecureStore from 'expo-secure-store';
import { apiConfiguration } from '../../config/environment';
import { onboardingStorageKey, parseOnboardingSeen } from './onboarding-rules';

function keyFor(userId: string) {
  return onboardingStorageKey(
    apiConfiguration.environment,
    apiConfiguration.apiOrigin,
    userId,
  );
}

export async function readOnboardingSeen(userId: string) {
  try {
    return parseOnboardingSeen(await SecureStore.getItemAsync(keyFor(userId)));
  } catch {
    return true;
  }
}

export async function writeOnboardingSeen(userId: string) {
  try {
    await SecureStore.setItemAsync(keyFor(userId), '1', {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // If storing fails the tour may be shown again; it never blocks the app.
  }
}
