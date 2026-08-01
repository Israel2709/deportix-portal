import { useQuery } from '@tanstack/react-query';
import {
  getFormula1Circuits,
  getFormula1Competitions,
  getFormula1DriverRankings,
  getFormula1Drivers,
  getFormula1Race,
  getFormula1RaceRankings,
  getFormula1Races,
  getFormula1Seasons,
  getFormula1TeamRankings,
  getFormula1Teams,
} from '@/lib/formula-1-api';
import type {
  Formula1CircuitItem,
  Formula1CompetitionItem,
  Formula1DriverItem,
  Formula1DriverRankingItem,
  Formula1RaceItem,
  Formula1RaceRankingItem,
  Formula1TeamItem,
  Formula1TeamRankingItem,
} from '@/lib/formula-1-bff-types';
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

export function useFormula1SeasonsQuery() {
  const result = useQuery({
    queryKey: queryKeys.f1.seasons(),
    queryFn: async () => {
      const envelope = await getFormula1Seasons();
      return envelope.response;
    },
    staleTime: STALE_TIME_STABLE_MS,
  });
  return hookResult(result, [] as number[]);
}

export function useFormula1CompetitionsQuery(query: Record<string, unknown> = {}) {
  const result = useQuery({
    queryKey: queryKeys.f1.competitions(query),
    queryFn: async () => {
      const envelope = await getFormula1Competitions(query);
      return envelope.response;
    },
    staleTime: STALE_TIME_STABLE_MS,
  });
  return hookResult(result, [] as Formula1CompetitionItem[]);
}

export function useFormula1CircuitsQuery(query: Record<string, unknown> = {}) {
  const result = useQuery({
    queryKey: queryKeys.f1.circuits(query),
    queryFn: async () => {
      const envelope = await getFormula1Circuits(query);
      return envelope.response;
    },
    staleTime: STALE_TIME_STABLE_MS,
  });
  return hookResult(result, [] as Formula1CircuitItem[]);
}

export function useFormula1TeamsQuery(query: Record<string, unknown> = {}) {
  const result = useQuery({
    queryKey: queryKeys.f1.teams(query),
    queryFn: async () => {
      const envelope = await getFormula1Teams(query);
      return envelope.response;
    },
    staleTime: STALE_TIME_STABLE_MS,
  });
  return hookResult(result, [] as Formula1TeamItem[]);
}

export function useFormula1DriversQuery(query: Record<string, unknown> = {}) {
  const result = useQuery({
    queryKey: queryKeys.f1.drivers(query),
    queryFn: async () => {
      const envelope = await getFormula1Drivers(query);
      return envelope.response;
    },
    staleTime: STALE_TIME_STABLE_MS,
  });
  return hookResult(result, [] as Formula1DriverItem[]);
}

export function useFormula1RacesQuery(query: { season?: number | string; id?: string } = {}, enabled = true) {
  const result = useQuery({
    queryKey: queryKeys.f1.races(query),
    queryFn: async () => {
      const envelope = await getFormula1Races(query);
      return envelope.response;
    },
    enabled,
    staleTime: STALE_TIME_VOLATILE_MS,
  });
  return hookResult(result, [] as Formula1RaceItem[]);
}

export function useFormula1RaceQuery(raceId: string | null) {
  const result = useQuery({
    queryKey: raceId ? queryKeys.f1.race(raceId) : ['f1', 'race', 'idle'],
    queryFn: async () => {
      const envelope = await getFormula1Race(raceId!);
      return envelope.response[0] ?? null;
    },
    enabled: raceId !== null,
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

export function useFormula1DriverRankingsQuery(season: number | string | null) {
  const result = useQuery({
    queryKey: season != null ? queryKeys.f1.driverRankings(season) : ['f1', 'rankings', 'drivers', 'idle'],
    queryFn: async () => {
      const envelope = await getFormula1DriverRankings({ season: season! });
      return envelope.response;
    },
    enabled: season != null && String(season).trim() !== '',
    staleTime: STALE_TIME_VOLATILE_MS,
  });
  return hookResult(result, [] as Formula1DriverRankingItem[]);
}

export function useFormula1TeamRankingsQuery(season: number | string | null) {
  const result = useQuery({
    queryKey: season != null ? queryKeys.f1.teamRankings(season) : ['f1', 'rankings', 'teams', 'idle'],
    queryFn: async () => {
      const envelope = await getFormula1TeamRankings({ season: season! });
      return envelope.response;
    },
    enabled: season != null && String(season).trim() !== '',
    staleTime: STALE_TIME_VOLATILE_MS,
  });
  return hookResult(result, [] as Formula1TeamRankingItem[]);
}

export function useFormula1RaceRankingsQuery(raceId: string | null) {
  const result = useQuery({
    queryKey: raceId ? queryKeys.f1.raceRankings(raceId) : ['f1', 'rankings', 'races', 'idle'],
    queryFn: async () => {
      const envelope = await getFormula1RaceRankings({ race: raceId! });
      return envelope.response;
    },
    enabled: raceId !== null,
    staleTime: STALE_TIME_VOLATILE_MS,
  });
  return hookResult(result, [] as Formula1RaceRankingItem[]);
}
