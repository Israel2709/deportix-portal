'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  pushRecentSearch,
  readRecentSearches,
  recentSearchStorageKey,
} from './recent-searches';

export function useRecentSearches(scope: string) {
  const storageKey = recentSearchStorageKey(scope);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecentSearches(storageKey));
  }, [storageKey]);

  const recordSearch = useCallback(
    (query: string) => {
      setRecent((current) => pushRecentSearch(storageKey, query, current));
    },
    [storageKey],
  );

  return { recent, recordSearch };
}
