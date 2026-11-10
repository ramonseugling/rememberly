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
    setResult((previous) => ({
      scope,
      path,
      data:
        previous.scope === scope && previous.path === path
          ? previous.data
          : null,
      loading: true,
      error: null,
    }));
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
                : 'Não foi possível carregar estas informações. Tente novamente.',
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

/** Pull-to-refresh state: the native spinner shows only for a pull, never for the first load. */
export function usePullRefresh() {
  const mounted = useRef(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = useCallback((action: () => Promise<unknown> | void) => {
    setRefreshing(true);
    void Promise.resolve(action()).finally(() => {
      if (mounted.current) setRefreshing(false);
    });
  }, []);
  return { refreshing, run };
}
