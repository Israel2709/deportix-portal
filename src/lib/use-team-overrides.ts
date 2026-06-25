'use client';

import { useCallback, useEffect, useState } from 'react';
import { readTeamOverrides } from './team-edits';

export function useTeamOverrides() {
  const [overrides, setOverrides] = useState<ReturnType<typeof readTeamOverrides>>({});

  const reload = useCallback(() => {
    setOverrides(readTeamOverrides());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { overrides, reload };
}
