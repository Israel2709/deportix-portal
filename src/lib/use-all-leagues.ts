'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from './api';
import type { ApiCollection, League } from './types';

const PAGE_SIZE = 100;

export function useAllLeagues(sport: string | null, enabled = true) {
  const [data, setData] = useState<League[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled && sport !== null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setData([]);
    setError(null);
    setLoading(enabled && sport !== null);
    setNonce((value) => value + 1);
  }, [enabled, sport]);

  useEffect(() => {
    if (sport === null || !enabled) {
      setLoading(false);
      return;
    }
    const sportSlug = sport;

    let active = true;

    async function load() {
      try {
        const leagues: League[] = [];
        let page = 1;
        let total = Number.POSITIVE_INFINITY;

        while (leagues.length < total && active) {
          const response = await apiGet<ApiCollection<League>>(
            `/v1/leagues?sport=${encodeURIComponent(sportSlug)}&page=${page}&pageSize=${PAGE_SIZE}`,
          );
          leagues.push(...response.data);
          total = response.meta.pagination?.total ?? leagues.length;

          if (response.data.length === 0 || response.data.length < PAGE_SIZE) break;
          page += 1;
        }

        if (active) {
          setData(leagues);
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
  }, [sport, nonce, enabled]);

  return { data, error, loading, reload };
}
