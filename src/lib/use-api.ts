'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from './api';

export interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Client-side data hook. Fetches a typed envelope from the API and exposes
 * loading / error / data so components can render the four required states
 * (loading, error, empty, partial). Pass `path = null` to stay idle.
 *
 * Loading is seeded in the state initializer (not via setState-in-effect) and re-armed in
 * `reload()`; the effect only writes state from its async callbacks.
 */
export function useApi<T>(path: string | null): ApiState<T> & { reload: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    loading: path !== null,
  });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setState({ data: null, error: null, loading: true });
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (path === null) return;
    let active = true;
    apiGet<T>(path)
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (active) {
          setState({
            data: null,
            error: err instanceof Error ? err.message : 'La solicitud falló.',
            loading: false,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [path, nonce]);

  return { ...state, reload };
}
