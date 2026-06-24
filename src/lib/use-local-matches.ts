'use client';

import { useCallback, useEffect, useState } from 'react';
import { readLocalMatches } from './local-matches';
import type { Match } from './types';

export function useLocalMatches(leagueId: string | null, seasonId: string | null) {
  const [matches, setMatches] = useState<Match[]>([]);

  const reload = useCallback(() => {
    if (!leagueId || !seasonId) {
      setMatches([]);
      return;
    }
    setMatches(readLocalMatches(leagueId, seasonId));
  }, [leagueId, seasonId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { matches, reload };
}
