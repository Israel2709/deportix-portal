'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  useLeagueMatchesQuery,
  type QueryHookResult,
} from '@/lib/query/hooks/league';
import { queryKeys } from '@/lib/query/keys';
import { sortMatchesByDateAsc } from '@/lib/match-sort';
import type { Match } from '@/lib/types';

/** Cached league matches with query-client cache updates for local edits. */
export function useAllMatches(
  leagueId: string | null,
  seasonYear: number | null,
  enabled = true,
  seasonId?: string | null,
): QueryHookResult<Match[]> & {
  applyUpdates: (updates: Match[]) => void;
  removeMatches: (matchIds: string[]) => void;
  appendMatches: (matches: Match[]) => void;
} {
  const queryClient = useQueryClient();
  const result = useLeagueMatchesQuery(
    enabled ? leagueId : null,
    enabled ? seasonYear : null,
    seasonId,
  );

  const applyUpdates = useCallback(
    (updates: Match[]) => {
      if (!leagueId || seasonYear === null || updates.length === 0) return;
      const byId = new Map(updates.map((match) => [match.id, match]));
      queryClient.setQueryData<Match[]>(queryKeys.matches(leagueId, seasonYear), (current) =>
        (current ?? []).map((match) => byId.get(match.id) ?? match),
      );
    },
    [leagueId, seasonYear, queryClient],
  );

  const removeMatches = useCallback(
    (matchIds: string[]) => {
      if (!leagueId || seasonYear === null || matchIds.length === 0) return;
      const ids = new Set(matchIds);
      queryClient.setQueryData<Match[]>(queryKeys.matches(leagueId, seasonYear), (current) =>
        (current ?? []).filter((match) => !ids.has(match.id)),
      );
    },
    [leagueId, seasonYear, queryClient],
  );

  const appendMatches = useCallback(
    (matches: Match[]) => {
      if (!leagueId || seasonYear === null || matches.length === 0) return;
      queryClient.setQueryData<Match[]>(queryKeys.matches(leagueId, seasonYear), (current) => {
        const existing = current ?? [];
        const ids = new Set(existing.map((match) => match.id));
        const toAdd = matches.filter((match) => !ids.has(match.id));
        if (toAdd.length === 0) return existing;
        return sortMatchesByDateAsc([...existing, ...toAdd]);
      });
    },
    [leagueId, seasonYear, queryClient],
  );

  return useMemo(
    () => ({
      ...result,
      applyUpdates,
      removeMatches,
      appendMatches,
    }),
    [result, applyUpdates, removeMatches, appendMatches],
  );
}
