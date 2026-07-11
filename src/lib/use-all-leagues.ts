'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { STALE_TIME_STABLE_MS } from '@/lib/query/client';
import type { ApiCollection, League } from '@/lib/types';

const PAGE_SIZE = 100;

export function useAllLeagues(sport: string | null, enabled = true) {
  const query = useQuery({
    queryKey: ['leagues', { sport }],
    queryFn: async () => {
      const leagues: League[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (leagues.length < total) {
        const response = await apiGet<ApiCollection<League>>(
          `/v1/leagues?sport=${encodeURIComponent(sport!)}&page=${page}&pageSize=${PAGE_SIZE}`,
        );
        leagues.push(...response.data);
        total = response.meta.pagination?.total ?? leagues.length;
        if (response.data.length === 0 || response.data.length < PAGE_SIZE) break;
        page += 1;
      }

      return leagues;
    },
    enabled: sport !== null && enabled,
    staleTime: STALE_TIME_STABLE_MS,
  });

  return {
    data: query.data ?? [],
    error: query.error?.message ?? null,
    loading: query.isPending || (query.isFetching && query.data === undefined),
    reload: () => {
      void query.refetch();
    },
  };
}
