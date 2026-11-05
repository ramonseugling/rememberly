import { fetch as expoFetch } from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import type { PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { apiConfiguration } from '../config/environment';
import { createSessionApi } from './api';
import { SessionController } from './controller';
import { createAuthenticatedTransport } from '../data/client';

const SessionContext = createContext<SessionController | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [controller] = useState(() => {
    const suffix = Array.from(apiConfiguration.apiOrigin)
      .map((char) => char.charCodeAt(0).toString(16))
      .join('');
    const key = `rememberly.session.${apiConfiguration.environment}.${suffix}`;
    return new SessionController(
      createSessionApi(apiConfiguration.apiOrigin, expoFetch),
      {
        get: () => SecureStore.getItemAsync(key),
        set: (token) =>
          SecureStore.setItemAsync(key, token, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }),
        remove: () => SecureStore.deleteItemAsync(key),
      },
      createAuthenticatedTransport(apiConfiguration.apiOrigin, expoFetch),
    );
  });
  useEffect(() => {
    void controller.restore();
    const subscription = AppState.addEventListener('change', (next) => {
      const status = controller.getSnapshot().status;
      if (
        next === 'active' &&
        (status === 'authenticated' || status === 'unavailable')
      ) {
        void controller.restore();
      }
    });
    return () => subscription.remove();
  }, [controller]);
  return (
    <SessionContext.Provider value={controller}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const controller = useContext(SessionContext);
  if (!controller) throw new Error('SessionProvider is required.');
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  return { state, controller };
}
