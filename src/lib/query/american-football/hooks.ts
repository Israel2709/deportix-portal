import { useMemo } from 'react';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import {
  getAmericanFootballGames,
  getAmericanFootballLeagues,
  getAmericanFootballSeasons,
  getAmericanFootballStandings,
  getAmericanFootballTeams,
  getAmericanFootballTimezones,
  updateAmericanFootballGame,
  deleteAmericanFootballGame,
} from '@/lib/american-football-api';
import { STALE_TIME_STABLE_MS, STALE_TIME_VOLATILE_MS } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';
import {
  americanFootballGameToMatch,
  americanFootballLeagueToLeague,
  americanFootballSeasonsToSeasons,
  americanFootballTeamToTeam,
  matchEditPatchToGameUpdate,
} from '@/lib/american-football/adapters';
import { sortMatchesByDateAsc } from '@/lib/match-sort';
import type { League, Match, Season, Standing, Team } from '@/lib/types';
import type { AmericanFootballGameItem, AmericanFootballLeagueItem } from '@/lib/american-football-bff-types';

function hookResult<T>(query: {
  data: T | undefined;
  error: Error | null;
  isPending: boolean;
  isFetching: boolean;
  refetch: () => unknown;
}, empty: T) {
  const hasData = query.data !== undefined;
  return {
    data: query.data ?? empty,
    error: query.error?.message ?? null,
    loading: query.isPending || (query.isFetching && !hasData),
    reload: () => {
      void query.refetch();
    },
  };
}

export function useAmericanFootballLeaguesQuery(query: Record<string, unknown> = {}) {
  const result = useQuery({
    queryKey: queryKeys.af.leagues(query),
    queryFn: async () => {
      const envelope = await getAmericanFootballLeagues(query);
      return envelope.response;
    },
    staleTime: STALE_TIME_STABLE_MS,
  });

  return hookResult(result, [] as AmericanFootballLeagueItem[]);
}

export function useAmericanFootballLeagueQuery(leagueId: string | null) {
  const result = useQuery({
    queryKey: leagueId ? queryKeys.af.leagues({ id: leagueId }) : ['af', 'leagues', 'idle'],
    queryFn: async () => {
      const envelope = await getAmericanFootballLeagues({ id: leagueId! });
      return envelope.response[0] ?? null;
    },
    enabled: leagueId !== null,
    staleTime: STALE_TIME_STABLE_MS,
  });

  const leagueItem = result.data ?? null;
  const league = leagueItem ? americanFootballLeagueToLeague(leagueItem) : null;

  return {
    leagueItem,
    league,
    error: result.error?.message ?? null,
    loading: result.isPending || (result.isFetching && result.data === undefined),
    reload: () => {
      void result.refetch();
    },
  };
}

export function useAmericanFootballSeasonsQuery(leagueId: string | null) {
  const leagueQuery = useAmericanFootballLeagueQuery(leagueId);
  const seasonsQuery = useQuery({
    queryKey: leagueId ? queryKeys.af.seasons(leagueId) : ['af', 'seasons', 'idle'],
    queryFn: async () => {
      const envelope = await getAmericanFootballSeasons(leagueId!);
      return envelope.response;
    },
    enabled: leagueId !== null,
    staleTime: STALE_TIME_STABLE_MS,
  });

  const seasons = useMemo(() => {
    if (!leagueId || !seasonsQuery.data) return [] as Season[];
    return americanFootballSeasonsToSeasons(
      leagueId,
      seasonsQuery.data,
      leagueQuery.leagueItem,
    );
  }, [leagueId, leagueQuery.leagueItem, seasonsQuery.data]);

  const result = hookResult(seasonsQuery, [] as number[]);
  return {
    ...result,
    data: seasons,
    loading: leagueQuery.loading || result.loading,
  };
}

export function useAmericanFootballTeamsQuery(
  leagueId: string | null,
  seasonYear: number | null,
): { data: Team[]; error: string | null; loading: boolean; reload: () => void } {
  const query = useQuery({
    queryKey:
      leagueId !== null && seasonYear !== null
        ? queryKeys.af.teams(leagueId, seasonYear)
        : ['af', 'teams', 'idle'],
    queryFn: async () => {
      const envelope = await getAmericanFootballTeams({ league: leagueId!, season: seasonYear! });
      return envelope.response.map((team) => americanFootballTeamToTeam(team, leagueId!));
    },
    enabled: leagueId !== null && seasonYear !== null,
    staleTime: STALE_TIME_STABLE_MS,
  });

  return hookResult(query, [] as Team[]);
}

export function useAmericanFootballGamesQuery(
  leagueId: string | null,
  seasonYear: number | null,
): {
  data: Match[];
  games: AmericanFootballGameItem[];
  error: string | null;
  loading: boolean;
  reload: () => void;
} {
  const query = useQuery({
    queryKey:
      leagueId !== null && seasonYear !== null
        ? queryKeys.af.games(leagueId, seasonYear)
        : ['af', 'games', 'idle'],
    queryFn: async () => {
      const envelope = await getAmericanFootballGames({ league: leagueId!, season: seasonYear! });
      return envelope.response;
    },
    enabled: leagueId !== null && seasonYear !== null,
    staleTime: STALE_TIME_VOLATILE_MS,
  });

  const games = query.data ?? [];
  const matches = useMemo(
    () =>
      sortMatchesByDateAsc(
        games.map((game) => americanFootballGameToMatch(game, leagueId!, seasonYear!)),
      ),
    [games, leagueId, seasonYear],
  );

  const base = hookResult(query, [] as AmericanFootballGameItem[]);
  return {
    ...base,
    data: matches,
    games,
  };
}

export function useAmericanFootballStandingsQuery(
  leagueId: string | null,
  seasonYear: number | null,
) {
  const query = useQuery({
    queryKey:
      leagueId !== null && seasonYear !== null
        ? queryKeys.af.standings(leagueId, seasonYear)
        : ['af', 'standings', 'idle'],
    queryFn: async () => {
      const envelope = await getAmericanFootballStandings({ league: leagueId!, season: seasonYear! });
      return envelope.response.map(
        (item): Standing => ({
          teamId: item.team.id,
          teamName: item.team.name,
          points: item.points?.for ?? null,
          played: (item.won ?? 0) + (item.lost ?? 0) + (item.ties ?? 0),
          wins: item.won ?? null,
          draws: item.ties ?? null,
          losses: item.lost ?? null,
          ties: item.ties ?? null,
        }),
      );
    },
    enabled: leagueId !== null && seasonYear !== null,
    staleTime: STALE_TIME_VOLATILE_MS,
  });

  return hookResult(query, [] as Standing[]);
}

export function useAmericanFootballTimezonesQuery() {
  const query = useQuery({
    queryKey: queryKeys.af.timezones(),
    queryFn: async () => {
      const envelope = await getAmericanFootballTimezones();
      return envelope.response;
    },
    staleTime: STALE_TIME_STABLE_MS,
  });

  return hookResult(query, [] as string[]);
}

export function useAmericanFootballLeagueResourceQueries(
  leagues: AmericanFootballLeagueItem[],
) {
  const seasonQueries = useQueries({
    queries: leagues.map((item) => ({
      queryKey: queryKeys.af.seasons(item.league.id),
      queryFn: async () => {
        const envelope = await getAmericanFootballSeasons(item.league.id);
        return envelope.response;
      },
      staleTime: STALE_TIME_STABLE_MS,
    })),
  });

  return { seasonQueries };
}

export async function patchAmericanFootballGameInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  leagueId: string,
  seasonYear: number,
  gameId: string,
  patch: import('@/lib/match-edits').MatchEditPatch,
  games: AmericanFootballGameItem[],
  teams: Team[] = [],
) {
  const game = games.find((entry) => entry.game.id === gameId);
  if (!game) throw new Error('No se encontró el partido.');

  const body = matchEditPatchToGameUpdate(game, patch, teams);
  const envelope = await updateAmericanFootballGame(gameId, body);
  const updated = envelope.response[0];
  if (!updated) throw new Error('No se pudo actualizar el partido.');

  queryClient.setQueryData<AmericanFootballGameItem[]>(
    queryKeys.af.games(leagueId, seasonYear),
    (current) =>
      (current ?? []).map((entry) => (entry.game.id === gameId ? updated : entry)),
  );

  return americanFootballGameToMatch(updated, leagueId, seasonYear);
}

export async function deleteAmericanFootballGameFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  leagueId: string,
  seasonYear: number,
  gameId: string,
) {
  await deleteAmericanFootballGame(gameId);
  queryClient.setQueryData<AmericanFootballGameItem[]>(
    queryKeys.af.games(leagueId, seasonYear),
    (current) => (current ?? []).filter((entry) => entry.game.id !== gameId),
  );
}

export function useAmericanFootballContenidoFromQueries() {
  const leaguesRes = useAmericanFootballLeaguesQuery();
  const timezonesRes = useAmericanFootballTimezonesQuery();
  const { seasonQueries } = useAmericanFootballLeagueResourceQueries(leaguesRes.data);

  const seasonItems = useMemo(() => {
    const items: { leagueId: string; leagueName: string; year: number }[] = [];
    leaguesRes.data.forEach((leagueItem, index) => {
      for (const year of seasonQueries[index]?.data ?? []) {
        items.push({
          leagueId: leagueItem.league.id,
          leagueName: leagueItem.league.name,
          year,
        });
      }
    });
    return items.sort(
      (left, right) => right.year - left.year || left.leagueName.localeCompare(right.leagueName),
    );
  }, [leaguesRes.data, seasonQueries]);

  const resourceQueries = useQueries({
    queries: seasonItems.flatMap((item) => [
      {
        queryKey: queryKeys.af.teams(item.leagueId, item.year),
        queryFn: async () => {
          const envelope = await getAmericanFootballTeams({ league: item.leagueId, season: item.year });
          return envelope.response.map((team) => ({
            team,
            leagueId: item.leagueId,
            leagueName: item.leagueName,
            season: item.year,
          }));
        },
        staleTime: STALE_TIME_VOLATILE_MS,
      },
      {
        queryKey: queryKeys.af.games(item.leagueId, item.year),
        queryFn: async () => {
          const envelope = await getAmericanFootballGames({ league: item.leagueId, season: item.year });
          return envelope.response;
        },
        staleTime: STALE_TIME_VOLATILE_MS,
      },
      {
        queryKey: queryKeys.af.standings(item.leagueId, item.year),
        queryFn: async () => {
          const envelope = await getAmericanFootballStandings({ league: item.leagueId, season: item.year });
          return envelope.response.map((standing) => ({
            standing,
            leagueId: item.leagueId,
            leagueName: item.leagueName,
            season: item.year,
          }));
        },
        staleTime: STALE_TIME_VOLATILE_MS,
      },
    ]),
  });

  const teams = useMemo(() => {
    const items: {
      team: import('@/lib/american-football-bff-types').AmericanFootballTeamItem;
      leagueId: string;
      leagueName: string;
      season: number;
    }[] = [];
    for (let index = 0; index < seasonItems.length; index += 1) {
      const data = resourceQueries[index * 3]?.data as typeof items | undefined;
      if (data) items.push(...data);
    }
    return items.sort((left, right) => left.team.name.localeCompare(right.team.name));
  }, [resourceQueries, seasonItems.length]);

  const games = useMemo(() => {
    const items: import('@/lib/american-football-bff-types').AmericanFootballGameItem[] = [];
    for (let index = 0; index < seasonItems.length; index += 1) {
      const data = resourceQueries[index * 3 + 1]?.data as
        | import('@/lib/american-football-bff-types').AmericanFootballGameItem[]
        | undefined;
      if (data) items.push(...data);
    }
    return items;
  }, [resourceQueries, seasonItems.length]);

  const standings = useMemo(() => {
    const items: {
      standing: import('@/lib/american-football-bff-types').AmericanFootballStandingItem;
      leagueId: string;
      leagueName: string;
      season: number;
    }[] = [];
    for (let index = 0; index < seasonItems.length; index += 1) {
      const data = resourceQueries[index * 3 + 2]?.data as typeof items | undefined;
      if (data) items.push(...data);
    }
    return items.sort(
      (left, right) => (left.standing.position ?? 999) - (right.standing.position ?? 999),
    );
  }, [resourceQueries, seasonItems.length]);

  const loading =
    leaguesRes.loading ||
    timezonesRes.loading ||
    seasonQueries.some((query) => query.isPending) ||
    resourceQueries.some((query) => query.isPending);

  const error =
    leaguesRes.error ||
    timezonesRes.error ||
    seasonQueries.find((query) => query.error)?.error?.message ||
    resourceQueries.find((query) => query.error)?.error?.message ||
    null;

  return {
    leagues: leaguesRes.data,
    seasons: seasonItems,
    teams,
    games,
    standings,
    timezones: timezonesRes.data,
    loading,
    error,
    reload: () => {
      leaguesRes.reload();
      timezonesRes.reload();
    },
  };
}
