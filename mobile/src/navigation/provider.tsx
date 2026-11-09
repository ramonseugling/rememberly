import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { router, useRootNavigationState } from 'expo-router';
import { useSession } from '../session/provider';
import { IntentQueue, pendingPath, type PendingIntent } from './intents';

const IntentContext = createContext<{
  enqueue: (intent: PendingIntent) => void;
  clear: () => void;
} | null>(null);
export function IntentProvider({ children }: PropsWithChildren) {
  const { state, controller } = useSession();
  const navigation = useRootNavigationState();
  const queue = useRef(new IntentQueue());
  const [revision, bump] = useState(0);
  const user =
    state.status === 'authenticated' ? (state.identity?.user.id ?? null) : null;
  useEffect(() => {
    // Read the controller as well, so delayed effects cannot navigate for an old identity.
    const current = controller.getSnapshot();
    const id =
      current.status === 'authenticated'
        ? (current.identity?.user.id ?? null)
        : null;
    queue.current.identity(id);
    if (!id || !navigation?.key) return;
    const intent = queue.current.take(id);
    if (intent) router.replace(pendingPath(intent));
  }, [user, revision, navigation?.key, controller]);
  const enqueue = useCallback(
    (intent: PendingIntent) => {
      const current = controller.getSnapshot();
      queue.current.enqueue(
        intent,
        current.status === 'authenticated'
          ? (current.identity?.user.id ?? null)
          : null,
      );
      bump((value) => value + 1);
    },
    [controller],
  );
  const clear = useCallback(() => queue.current.clear(), []);
  return (
    <IntentContext.Provider value={{ enqueue, clear }}>
      {children}
    </IntentContext.Provider>
  );
}
export function useIntents() {
  const value = useContext(IntentContext);
  if (!value) throw new Error('IntentProvider is required.');
  return value;
}
