import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { useSession } from '../../session/provider';
import { nativeNotifications } from './native';
import { foregroundPresentation } from './workflow';

export function NotificationRuntime() {
  const { controller } = useSession();
  useEffect(() => {
    if (nativeNotifications.unavailableReason()) return;
    Notifications.setNotificationHandler({
      handleNotification: async () =>
        foregroundPresentation(controller.getSnapshot().status),
    });
    return () => Notifications.setNotificationHandler(null);
  }, [controller]);
  return null;
}
