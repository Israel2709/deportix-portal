'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from './api';
import type { ApiCollection, Match } from './types';

const PAGE_SIZE = 100;

export function leagueMatchesPagePath(
  leagueId: string,
  seasonYear: number,
  page: number,
  pageSize = PAGE_SIZE,
): string {
  const id = encodeURIComponent(leagueId);
  return `/v1/leagues/${id}/matches?season=${seasonYear}&page=${page}&pageSize=${pageSize}`;
}

/** Fetches every page of a league's matches for a given season. */
export function useAllMatches(
  leagueId: string | null,
  seasonYear: number | null,
  enabled = true,
) {
  const [data, setData] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled && leagueId !== null && seasonYear !== null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setData([]);
    setError(null);
    setLoading(enabled && leagueId !== null && seasonYear !== null);
    setNonce((value) => value + 1);
  }, [enabled, leagueId, seasonYear]);

  const applyUpdates = useCallback((updates: Match[]) => {
    if (updates.length === 0) return;
    const byId = new Map(updates.map((match) => [match.id, match]));
    setData((current) => current.map((match) => byId.get(match.id) ?? match));
  }, []);

  useEffect(() => {
    if (leagueId === null || seasonYear === null || !enabled) {
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        const matches: Match[] = [];
        let page = 1;
        let total = Number.POSITIVE_INFINITY;

        while (matches.length < total && active) {
          const response = await apiGet<ApiCollection<Match>>(
            leagueMatchesPagePath(leagueId!, seasonYear!, page),
          );
          matches.push(...response.data);
          total = response.meta.pagination?.total ?? matches.length;

          if (response.data.length === 0 || response.data.length < PAGE_SIZE) break;
          page += 1;
        }

        if (active) {
          setData(matches);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setData([]);
          setError(err instanceof Error ? err.message : 'La solicitud falló.');
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [leagueId, seasonYear, nonce, enabled]);

  return { data, error, loading, reload, applyUpdates };
}
