import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useFocusEffect } from 'expo-router';

interface AddAction {
  label: string;
  run: () => void;
}
interface AddActions {
  action: AddAction | null;
  register: (action: AddAction) => () => void;
}
const Context = createContext<AddActions>({
  action: null,
  register: () => () => {},
});
export const AddActionProvider = ({ children }: PropsWithChildren) => {
  const [action, setAction] = useState<AddAction | null>(null);
  const register = useCallback((next: AddAction) => {
    setAction(next);
    return () => setAction((current) => (current === next ? null : current));
  }, []);
  return (
    <Context.Provider value={{ action, register }}>{children}</Context.Provider>
  );
};
export const useAddAction = () => useContext(Context).action;
export function useScreenAddAction(label: string, run: () => void) {
  const { register } = useContext(Context);
  const current = useRef(run);
  current.current = run;
  useFocusEffect(
    useCallback(
      () => register({ label, run: () => current.current() }),
      [label, register],
    ),
  );
}
