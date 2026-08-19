'use client';

import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { getFormula1Circuits, getFormula1Races, getFormula1Seasons } from '@/lib/formula-1-api';
import type { Formula1RaceItem } from '@/lib/formula-1-bff-types';
import {
  countriesFromCircuits,
  countriesFromRaces,
  mergeFormula1Countries,
} from '@/lib/formula-1-browse';
import { STALE_TIME_STABLE_MS, STALE_TIME_VOLATILE_MS } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';

export function useFormula1BrowseIndex() {
  const seasonsQuery = useQuery({
    queryKey: queryKeys.f1.seasons(),
    queryFn: async () => (await getFormula1Seasons()).response,
    staleTime: STALE_TIME_STABLE_MS,
  });

  const circuitsQuery = useQuery({
    queryKey: queryKeys.f1.circuits(),
    queryFn: async () => (await getFormula1Circuits()).response,
    staleTime: STALE_TIME_STABLE_MS,
  });

  const seasons = seasonsQuery.data ?? [];

  const raceQueries = useQueries({
    queries: seasons.map((season) => ({
      queryKey: queryKeys.f1.races({ season }),
      queryFn: async () => (await getFormula1Races({ season })).response,
      staleTime: STALE_TIME_VOLATILE_MS,
      enabled: seasons.length > 0,
    })),
  });

  const races = useMemo(
    () => raceQueries.flatMap((query) => query.data ?? []) as Formula1RaceItem[],
    [raceQueries],
  );

  const countries = useMemo(
    () =>
      mergeFormula1Countries(
        countriesFromRaces(races),
        countriesFromCircuits(circuitsQuery.data ?? []),
      ),
    [races, circuitsQuery.data],
  );

  const loading =
    seasonsQuery.isPending ||
    circuitsQuery.isPending ||
    (seasons.length > 0 && raceQueries.some((query) => query.isPending));

  const firstError =
    seasonsQuery.error ?? circuitsQuery.error ?? raceQueries.find((query) => query.error)?.error;

  const error =
    firstError instanceof Error
      ? firstError.message
      : firstError
        ? String(firstError)
        : null;

  return {
    seasons,
    countries,
    races,
    loading,
    error,
    reload: () => {
      void seasonsQuery.refetch();
      void circuitsQuery.refetch();
      for (const query of raceQueries) void query.refetch();
    },
  };
}
