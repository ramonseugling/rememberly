import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useSession } from '../../session/provider';
import { useIntents } from '../../navigation/provider';
import {
  acceptNotificationId,
  parseNotification,
} from '../../navigation/intents';
import { nativeNotifications } from './native';
import { foregroundPresentation } from './workflow';

export function NotificationRuntime() {
  const { controller } = useSession();
  const { enqueue } = useIntents();
  const seen = useRef(new Set<string>());
  useEffect(() => {
    if (nativeNotifications.unavailableReason()) return;
    let active = true;
    Notifications.setNotificationHandler({
      handleNotification: async () =>
        foregroundPresentation(controller.getSnapshot().status),
    });
    function receive(response: Notifications.NotificationResponse) {
      if (
        !active ||
        response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
      )
        return;
      const id = response.notification.request.identifier;
      if (!acceptNotificationId(seen.current, id)) return;
      // Clear the native cache so an old tap cannot be replayed after account switching/restart.
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
      const intent = parseNotification(
        response.notification.request.content.data,
      );
      if (intent) enqueue(intent);
    }
    const subscription =
      Notifications.addNotificationResponseReceivedListener(receive);
    const initialIdentity = controller.getSnapshot().identity;
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!active || controller.getSnapshot().identity !== initialIdentity) {
          // Discard stale startup taps as well as consumed taps to prevent replay.
          if (response)
            void Notifications.clearLastNotificationResponseAsync().catch(
              () => {},
            );
          return;
        }
        if (response) receive(response);
      })
      .catch(() => {});
    return () => {
      active = false;
      subscription.remove();
      Notifications.setNotificationHandler(null);
    };
  }, [controller, enqueue]);
  return null;
}
