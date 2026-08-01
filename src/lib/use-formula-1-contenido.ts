'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import {
  getFormula1Circuits,
  getFormula1Competitions,
  getFormula1DriverRankings,
  getFormula1Drivers,
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
  Formula1TeamItem,
  Formula1TeamRankingItem,
} from '@/lib/formula-1-bff-types';
import { STALE_TIME_STABLE_MS, STALE_TIME_VOLATILE_MS } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';

export interface Formula1ContenidoData {
  seasons: number[];
  competitions: Formula1CompetitionItem[];
  circuits: Formula1CircuitItem[];
  teams: Formula1TeamItem[];
  drivers: Formula1DriverItem[];
  races: Formula1RaceItem[];
  driverRankings: Formula1DriverRankingItem[];
  teamRankings: Formula1TeamRankingItem[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useFormula1Contenido(_refreshKey = 0): Formula1ContenidoData {
  const seasonsQuery = useQuery({
    queryKey: queryKeys.f1.seasons(),
    queryFn: async () => (await getFormula1Seasons()).response,
    staleTime: STALE_TIME_STABLE_MS,
  });

  const catalogQueries = useQueries({
    queries: [
      {
        queryKey: queryKeys.f1.competitions(),
        queryFn: async () => (await getFormula1Competitions()).response,
        staleTime: STALE_TIME_STABLE_MS,
      },
      {
        queryKey: queryKeys.f1.circuits(),
        queryFn: async () => (await getFormula1Circuits()).response,
        staleTime: STALE_TIME_STABLE_MS,
      },
      {
        queryKey: queryKeys.f1.teams(),
        queryFn: async () => (await getFormula1Teams()).response,
        staleTime: STALE_TIME_STABLE_MS,
      },
      {
        queryKey: queryKeys.f1.drivers(),
        queryFn: async () => (await getFormula1Drivers()).response,
        staleTime: STALE_TIME_STABLE_MS,
      },
    ],
  });

  const seasons = seasonsQuery.data ?? [];
  const latestSeason = seasons[0] ?? null;

  const racesQuery = useQuery({
    queryKey: latestSeason != null ? queryKeys.f1.races({ season: latestSeason }) : ['f1', 'races', 'idle'],
    queryFn: async () => (await getFormula1Races({ season: latestSeason! })).response,
    enabled: latestSeason != null,
    staleTime: STALE_TIME_VOLATILE_MS,
  });

  const driverRankingsQuery = useQuery({
    queryKey:
      latestSeason != null
        ? queryKeys.f1.driverRankings(latestSeason)
        : ['f1', 'rankings', 'drivers', 'idle'],
    queryFn: async () => (await getFormula1DriverRankings({ season: latestSeason! })).response,
    enabled: latestSeason != null,
    staleTime: STALE_TIME_VOLATILE_MS,
  });

  const teamRankingsQuery = useQuery({
    queryKey:
      latestSeason != null ? queryKeys.f1.teamRankings(latestSeason) : ['f1', 'rankings', 'teams', 'idle'],
    queryFn: async () => (await getFormula1TeamRankings({ season: latestSeason! })).response,
    enabled: latestSeason != null,
    staleTime: STALE_TIME_VOLATILE_MS,
  });

  const allQueries = [
    seasonsQuery,
    ...catalogQueries,
    racesQuery,
    driverRankingsQuery,
    teamRankingsQuery,
  ];

  const loading = allQueries.some((q) => q.isPending || (q.isFetching && q.data === undefined));
  const firstError = allQueries.find((q) => q.error)?.error;
  const error = firstError instanceof Error ? firstError.message : firstError ? String(firstError) : null;

  return {
    seasons,
    competitions: (catalogQueries[0]?.data ?? []) as Formula1CompetitionItem[],
    circuits: (catalogQueries[1]?.data ?? []) as Formula1CircuitItem[],
    teams: (catalogQueries[2]?.data ?? []) as Formula1TeamItem[],
    drivers: (catalogQueries[3]?.data ?? []) as Formula1DriverItem[],
    races: racesQuery.data ?? [],
    driverRankings: driverRankingsQuery.data ?? [],
    teamRankings: teamRankingsQuery.data ?? [],
    loading,
    error,
    reload: () => {
      for (const q of allQueries) void q.refetch();
    },
  };
}
