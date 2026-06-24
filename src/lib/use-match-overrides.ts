'use client';

import { useCallback, useEffect, useState } from 'react';
import { readMatchOverrides } from './match-edits';

export function useMatchOverrides(leagueId: string | null, seasonId: string | null) {
  const [overrides, setOverrides] = useState<ReturnType<typeof readMatchOverrides>>({});

  const reload = useCallback(() => {
    if (!leagueId || !seasonId) {
      setOverrides({});
      return;
    }
    setOverrides(readMatchOverrides(leagueId, seasonId));
  }, [leagueId, seasonId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { overrides, reload };
}
