import { useQuery } from '@tanstack/react-query';
import {
  getTennisEntries,
  getTennisMatch,
  getTennisMatches,
  getTennisPlayers,
  getTennisRound,
  getTennisRounds,
  getTennisTournament,
  getTennisTournamentEntries,
  getTennisTournamentMatches,
  getTennisTournamentRounds,
  getTennisTournaments,
} from '@/lib/tennis-api';
import type {
  TennisEntryItem,
  TennisMatchItem,
  TennisPlayerItem,
  TennisRoundItem,
  TennisTournamentItem,
} from '@/lib/tennis-bff-types';
import { STALE_TIME_STABLE_MS, STALE_TIME_VOLATILE_MS } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';

function hookResult<T>(
  query: {
    data: T | undefined;
    error: Error | null;
    isPending: boolean;
    isFetching: boolean;
    refetch: () => unknown;
  },
  empty: T,
) {
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

export function useTennisPlayersQuery(query: Record<string, unknown> = {}) {
  const result = useQuery({
    queryKey: queryKeys.tennis.players(query),
    queryFn: async () => (await getTennisPlayers(query)).response,
    staleTime: STALE_TIME_STABLE_MS,
  });
  return hookResult(result, [] as TennisPlayerItem[]);
}

export function useTennisTournamentsQuery(query: Record<string, unknown> = {}) {
  const result = useQuery({
    queryKey: queryKeys.tennis.tournaments(query),
    queryFn: async () => (await getTennisTournaments(query)).response,
    staleTime: STALE_TIME_STABLE_MS,
  });
  return hookResult(result, [] as TennisTournamentItem[]);
}

export function useTennisTournamentQuery(tournamentId: string | null) {
  const result = useQuery({
    queryKey: tournamentId ? queryKeys.tennis.tournament(tournamentId) : ['tennis', 'tournament', 'idle'],
    queryFn: async () => {
      const envelope = await getTennisTournament(tournamentId!);
      return envelope.response[0] ?? null;
    },
    enabled: tournamentId !== null,
    staleTime: STALE_TIME_STABLE_MS,
  });
  return {
    data: result.data ?? null,
    error: result.error?.message ?? null,
    loading: result.isPending || (result.isFetching && result.data === undefined),
    reload: () => {
      void result.refetch();
    },
  };
}

export function useTennisRoundQuery(roundId: string | null) {
  const result = useQuery({
    queryKey: roundId ? queryKeys.tennis.round(roundId) : ['tennis', 'round', 'idle'],
    queryFn: async () => {
      const envelope = await getTennisRound(roundId!);
      return envelope.response[0] ?? null;
    },
    enabled: roundId !== null,
    staleTime: STALE_TIME_STABLE_MS,
  });
  return {
    data: result.data ?? null,
    error: result.error?.message ?? null,
    loading: result.isPending || (result.isFetching && result.data === undefined),
    reload: () => {
      void result.refetch();
    },
  };
}

export function useTennisMatchQuery(matchId: string | null) {
  const result = useQuery({
    queryKey: matchId ? queryKeys.tennis.match(matchId) : ['tennis', 'match', 'idle'],
    queryFn: async () => {
      const envelope = await getTennisMatch(matchId!);
      return envelope.response[0] ?? null;
    },
    enabled: matchId !== null,
    staleTime: STALE_TIME_VOLATILE_MS,
  });
  return {
    data: result.data ?? null,
    error: result.error?.message ?? null,
    loading: result.isPending || (result.isFetching && result.data === undefined),
    reload: () => {
      void result.refetch();
    },
  };
}

export function useTennisRoundsQuery(
  query: { tournament?: string; id?: string } = {},
  enabled = true,
) {
  const result = useQuery({
    queryKey: queryKeys.tennis.rounds(query),
    queryFn: async () => {
      if (query.tournament) {
        return (await getTennisTournamentRounds(query.tournament)).response;
      }
      return (await getTennisRounds(query)).response;
    },
    enabled: enabled && (Boolean(query.tournament) || Boolean(query.id)),
    staleTime: STALE_TIME_VOLATILE_MS,
  });
  return hookResult(result, [] as TennisRoundItem[]);
}

export function useTennisEntriesQuery(
  query: { tournament?: string; id?: string } = {},
  enabled = true,
) {
  const result = useQuery({
    queryKey: queryKeys.tennis.entries(query),
    queryFn: async () => {
      if (query.tournament) {
        return (await getTennisTournamentEntries(query.tournament)).response;
      }
      return (await getTennisEntries(query)).response;
    },
    enabled: enabled && (Boolean(query.tournament) || Boolean(query.id)),
    staleTime: STALE_TIME_VOLATILE_MS,
  });
  return hookResult(result, [] as TennisEntryItem[]);
}

export function useTennisMatchesQuery(
  query: { tournament?: string; round?: string; id?: string } = {},
  enabled = true,
) {
  const result = useQuery({
    queryKey: queryKeys.tennis.matches(query),
    queryFn: async () => {
      if (query.tournament) {
        return (await getTennisTournamentMatches(query.tournament, { round: query.round })).response;
      }
      return (await getTennisMatches(query)).response;
    },
    enabled: enabled && (Boolean(query.tournament) || Boolean(query.id)),
    staleTime: STALE_TIME_VOLATILE_MS,
  });
  return hookResult(result, [] as TennisMatchItem[]);
}

export function useTennisContenidoQuery() {
  const players = useTennisPlayersQuery();
  const tournaments = useTennisTournamentsQuery();
  const loading = players.loading || tournaments.loading;
  const error = players.error ?? tournaments.error;
  return {
    players: players.data,
    tournaments: tournaments.data,
    loading,
    error,
    reload: () => {
      players.reload();
      tournaments.reload();
    },
  };
}
