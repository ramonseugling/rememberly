import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiConfiguration } from '../../config/environment';
import { installationStorageKey, type NotificationNative } from './workflow';

const key = installationStorageKey(
  apiConfiguration.environment,
  apiConfiguration.apiOrigin,
);
let pendingInstallation: Promise<string> | null = null;

async function installationId() {
  if (pendingInstallation) return pendingInstallation;
  pendingInstallation = (async () => {
    const saved = await SecureStore.getItemAsync(key);
    if (saved) return saved;
    const id = Crypto.randomUUID();
    await SecureStore.setItemAsync(key, id, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return id;
  })();
  try {
    return await pendingInstallation;
  } finally {
    pendingInstallation = null;
  }
}

function projectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId
  );
}

async function prepareChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export const nativeNotifications: NotificationNative = {
  platform: Platform.OS === 'ios' ? 'ios' : 'android',
  unavailableReason() {
    if (!['ios', 'android'].includes(Platform.OS) || !Device.isDevice)
      return 'Push registration requires a physical iOS or Android device.';
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient)
      return 'Push registration requires an installed development or release build. Expo Go is not supported.';
    if (!projectId()) return 'The native build is missing its EAS project ID.';
    return null;
  },
  permission: () => Notifications.getPermissionsAsync(),
  async requestPermission() {
    await prepareChannel();
    return Notifications.requestPermissionsAsync();
  },
  installationId,
  async token() {
    await prepareChannel();
    return (
      await Notifications.getExpoPushTokenAsync({ projectId: projectId() })
    ).data;
  },
};
