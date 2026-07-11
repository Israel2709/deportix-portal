import { QueryClient } from '@tanstack/react-query';

export const STALE_TIME_STABLE_MS = 5 * 60 * 1000;
export const STALE_TIME_VOLATILE_MS = 60 * 1000;
export const GC_TIME_MS = 30 * 60 * 1000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_STABLE_MS,
        gcTime: GC_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
