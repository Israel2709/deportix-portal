'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from './api';
import { sortMatchesByDateAsc } from './match-sort';
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

function matchesContextKey(
  leagueId: string | null,
  seasonYear: number | null,
  enabled: boolean,
): string | null {
  if (!enabled || leagueId === null || seasonYear === null) return null;
  return `${leagueId}:${seasonYear}`;
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
  const dataRef = useRef(data);
  const contextKeyRef = useRef<string | null>(null);

  dataRef.current = data;

  const reload = useCallback(() => {
    setError(null);
    setNonce((value) => value + 1);
  }, []);

  const applyUpdates = useCallback((updates: Match[]) => {
    if (updates.length === 0) return;
    const byId = new Map(updates.map((match) => [match.id, match]));
    setData((current) => current.map((match) => byId.get(match.id) ?? match));
  }, []);

  const removeMatches = useCallback((matchIds: string[]) => {
    if (matchIds.length === 0) return;
    const ids = new Set(matchIds);
    setData((current) => current.filter((match) => !ids.has(match.id)));
  }, []);

  const appendMatches = useCallback((matches: Match[]) => {
    if (matches.length === 0) return;
    setData((current) => {
      const ids = new Set(current.map((match) => match.id));
      const toAdd = matches.filter((match) => !ids.has(match.id));
      if (toAdd.length === 0) return current;
      return sortMatchesByDateAsc([...current, ...toAdd]);
    });
  }, []);

  useEffect(() => {
    const contextKey = matchesContextKey(leagueId, seasonYear, enabled);

    if (contextKey === null) {
      contextKeyRef.current = null;
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    const contextChanged = contextKeyRef.current !== contextKey;
    contextKeyRef.current = contextKey;

    let active = true;

    if (contextChanged) {
      setData([]);
      setError(null);
      setLoading(true);
    } else if (dataRef.current.length === 0) {
      setLoading(true);
    }

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

  return { data, error, loading, reload, applyUpdates, removeMatches, appendMatches };
}
