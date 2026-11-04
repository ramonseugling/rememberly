import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '../session/provider';
import { ApiError } from './client';

export { ApiError } from './client';
export type { RequestOptions } from './client';

export function useAuthenticatedApi() {
  const { controller } = useSession();
  return useMemo(() => ({ request: controller.request }), [controller]);
}

export function useResource<T>(path: string | null): {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
} {
  const { state } = useSession();
  const { request } = useAuthenticatedApi();
  const scope = state.status === 'authenticated' ? state.identity : null;
  const mounted = useRef(true);
  const sequence = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const [result, setResult] = useState<{
    scope: typeof scope;
    path: string | null;
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ scope: null, path: null, data: null, loading: false, error: null });

  const cancel = useCallback(() => {
    sequence.current += 1;
    pending.current?.abort();
    pending.current = null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel();
    };
  }, [cancel]);

  const reload = useCallback(async () => {
    cancel();
    const current = sequence.current;
    if (!scope || !path || !mounted.current) {
      if (mounted.current)
        setResult({ scope, path, data: null, loading: false, error: null });
      return;
    }
    const abort = new AbortController();
    pending.current = abort;
    setResult({ scope, path, data: null, loading: true, error: null });
    try {
      const data = await request<T>(path, { signal: abort.signal });
      if (
        mounted.current &&
        current === sequence.current &&
        !abort.signal.aborted
      ) {
        setResult({ scope, path, data, loading: false, error: null });
      }
    } catch (error) {
      if (
        mounted.current &&
        current === sequence.current &&
        !abort.signal.aborted
      ) {
        setResult({
          scope,
          path,
          data: null,
          loading: false,
          error:
            error instanceof ApiError &&
            ['cancelled', 'stale'].includes(error.kind)
              ? null
              : error instanceof ApiError
                ? error.message
                : 'Unable to load this information. Please try again.',
        });
      }
    }
  }, [cancel, path, request, scope]);

  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        cancel();
        if (mounted.current)
          setResult({ scope, path, data: null, loading: false, error: null });
      };
    }, [cancel, path, reload, scope]),
  );

  const matching =
    result.scope === scope && result.path === path && scope !== null;
  return {
    data: matching ? result.data : null,
    loading: matching ? result.loading : !!scope && !!path,
    error: matching ? result.error : null,
    reload,
  };
}
