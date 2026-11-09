import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { useSession } from '../../session/provider';
import { readOnboardingSeen, writeOnboardingSeen } from './onboarding-storage';

export type OnboardingStatus = 'loading' | 'pending' | 'seen';

interface OnboardingValue {
  status: OnboardingStatus;
  complete: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingValue>({
  status: 'seen',
  complete: async () => {},
});

export function OnboardingProvider({ children }: PropsWithChildren) {
  const { state } = useSession();
  const userId = state.identity?.user.id;
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    if (!userId) return;
    void readOnboardingSeen(userId).then((seen) => {
      if (active) setStatus(seen ? 'seen' : 'pending');
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const complete = useCallback(async () => {
    if (userId) await writeOnboardingSeen(userId);
    setStatus('seen');
  }, [userId]);

  const value = useMemo(() => ({ status, complete }), [status, complete]);
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
