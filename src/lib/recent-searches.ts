const MAX_RECENT_SEARCHES = 5;

export function recentSearchStorageKey(scope: string): string {
  return `deportix.recentLeagueSearches.${scope}`;
}

export function readRecentSearches(key: string): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

export function writeRecentSearches(key: string, searches: string[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES)));
}

export function pushRecentSearch(key: string, query: string, current: string[]): string[] {
  const trimmed = query.trim();
  if (!trimmed) return current;

  const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(0, MAX_RECENT_SEARCHES);
  writeRecentSearches(key, next);
  return next;
}
