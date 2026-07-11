/**
 * @deprecated Prefer specific hooks in `@/lib/query/hooks/league`.
 * Retained as a thin TanStack Query wrapper for non-migrated screens.
 */
'use client';

import { useApiPathQuery } from '@/lib/query/hooks/league';
import type { ApiState } from '@/lib/use-api';

/**
 * Thin wrapper over TanStack Query for legacy call sites outside Liga MX.
 * Prefer specific hooks in `@/lib/query/hooks/league` for league resources.
 */
export function useApi<T>(path: string | null): ApiState<T> & { reload: () => void } {
  const result = useApiPathQuery<T>(path);
  return {
    data: result.data,
    error: result.error,
    loading: result.loading,
    reload: result.reload,
  };
}
