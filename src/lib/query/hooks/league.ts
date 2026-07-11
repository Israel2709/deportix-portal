import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { STALE_TIME_STABLE_MS, STALE_TIME_VOLATILE_MS } from '@/lib/query/client';
import {
  fetchApiPath,
  fetchLeague,
  fetchLeagueMatches,
  fetchLeagueSeasons,
  fetchLeagueStandings,
  fetchLeagueTeams,
  fetchTeam,
} from '@/lib/query/fetchers';
import { queryKeys } from '@/lib/query/keys';
import { readLocalMatches } from '@/lib/local-matches';
import { applyTeamOverrides, readTeamOverrides } from '@/lib/team-edits';
import { sortMatchesByDateAsc } from '@/lib/match-sort';
import type { Match, Standing, Team } from '@/lib/types';

export interface QueryHookResult<T> {
  data: T;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

function toHookResult<T>(
  data: T | undefined,
  error: Error | null,
  isPending: boolean,
  isFetching: boolean,
  refetch: () => void,
  empty: T,
): QueryHookResult<T> {
  const hasData = data !== undefined;
  return {
    data: data ?? empty,
    error: error?.message ?? null,
    loading: isPending || (isFetching && !hasData),
    reload: () => {
      void refetch();
    },
  };
}

export function useLeagueQuery(leagueId: string | null): QueryHookResult<import('@/lib/types').League | null> {
  const query = useQuery({
    queryKey: leagueId ? queryKeys.league(leagueId) : ['league', 'idle'],
    queryFn: () => fetchLeague(leagueId!),
    enabled: leagueId !== null,
    staleTime: STALE_TIME_STABLE_MS,
  });

  return toHookResult(query.data ?? null, query.error, query.isPending, query.isFetching, query.refetch, null);
}

export function useLeagueSeasonsQuery(leagueId: string | null): QueryHookResult<import('@/lib/types').Season[]> {
  const query = useQuery({
    queryKey: leagueId ? queryKeys.seasons(leagueId) : ['seasons', 'idle'],
    queryFn: () => fetchLeagueSeasons(leagueId!),
    enabled: leagueId !== null,
    staleTime: STALE_TIME_STABLE_MS,
  });

  return toHookResult(query.data ?? [], query.error, query.isPending, query.isFetching, query.refetch, []);
}

export function useLeagueTeamsQuery(
  leagueId: string | null,
  seasonYear?: number | null,
): QueryHookResult<Team[]> {
  const query = useQuery({
    queryKey: leagueId ? queryKeys.teams(leagueId, seasonYear) : ['teams', 'idle'],
    queryFn: () => fetchLeagueTeams(leagueId!, seasonYear),
    enabled: leagueId !== null,
    staleTime: STALE_TIME_STABLE_MS,
  });

  const data = useMemo(() => {
    const teams = query.data ?? [];
    return applyTeamOverrides(teams, readTeamOverrides());
  }, [query.data]);

  return toHookResult(data, query.error, query.isPending, query.isFetching, query.refetch, []);
}

export function useLeagueMatchesQuery(
  leagueId: string | null,
  seasonYear: number | null,
  seasonId?: string | null,
): QueryHookResult<Match[]> {
  const query = useQuery({
    queryKey:
      leagueId !== null && seasonYear !== null
        ? queryKeys.matches(leagueId, seasonYear)
        : ['matches', 'idle'],
    queryFn: () => fetchLeagueMatches(leagueId!, seasonYear!),
    enabled: leagueId !== null && seasonYear !== null,
    staleTime: STALE_TIME_VOLATILE_MS,
  });

  const data = useMemo(() => {
    const apiMatches = query.data ?? [];
    if (!leagueId || !seasonId) return sortMatchesByDateAsc(apiMatches);
    const localMatches = readLocalMatches(leagueId, seasonId);
    return sortMatchesByDateAsc([...apiMatches, ...localMatches]);
  }, [query.data, leagueId, seasonId]);

  return toHookResult(data, query.error, query.isPending, query.isFetching, query.refetch, []);
}

export function useLeagueStandingsQuery(
  leagueId: string | null,
  seasonYear: number | null,
): QueryHookResult<Standing[]> {
  const query = useQuery({
    queryKey:
      leagueId !== null && seasonYear !== null
        ? queryKeys.standings(leagueId, seasonYear)
        : ['standings', 'idle'],
    queryFn: () => fetchLeagueStandings(leagueId!, seasonYear!),
    enabled: leagueId !== null && seasonYear !== null,
    staleTime: STALE_TIME_VOLATILE_MS,
  });

  return toHookResult(query.data ?? [], query.error, query.isPending, query.isFetching, query.refetch, []);
}

export function useTeamQuery(teamId: string | null): QueryHookResult<Team | null> {
  const query = useQuery({
    queryKey: teamId ? queryKeys.team(teamId) : ['team', 'idle'],
    queryFn: () => fetchTeam(teamId!),
    enabled: teamId !== null,
    staleTime: STALE_TIME_STABLE_MS,
  });

  return toHookResult(query.data ?? null, query.error, query.isPending, query.isFetching, query.refetch, null);
}

export function useApiPathQuery<T>(path: string | null): QueryHookResult<T | null> {
  const query = useQuery({
    queryKey: path ? queryKeys.apiPath(path) : ['api', 'idle'],
    queryFn: () => fetchApiPath<T>(path!),
    enabled: path !== null,
    staleTime: STALE_TIME_STABLE_MS,
  });

  return toHookResult(query.data ?? null, query.error, query.isPending, query.isFetching, query.refetch, null);
}

export function useLeagueSeasonResourceQueries(
  leagueId: string,
  seasons: { id: string; year: number }[],
) {
  const matchQueries = useQueries({
    queries: seasons.map((season) => ({
      queryKey: queryKeys.matches(leagueId, season.year),
      queryFn: () => fetchLeagueMatches(leagueId, season.year),
      staleTime: STALE_TIME_VOLATILE_MS,
    })),
  });

  const standingQueries = useQueries({
    queries: seasons.map((season) => ({
      queryKey: queryKeys.standings(leagueId, season.year),
      queryFn: () => fetchLeagueStandings(leagueId, season.year),
      staleTime: STALE_TIME_VOLATILE_MS,
    })),
  });

  return { matchQueries, standingQueries };
}
