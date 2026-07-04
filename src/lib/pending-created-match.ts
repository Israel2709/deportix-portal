import type { Match } from './types';

const STORAGE_KEY = 'deportix.createdMatch.v1';

interface StashedCreatedMatch {
  match: Match;
  seasonId: string | null;
}

/** Stash a match created via POST so the league view can show it before CDN cache refreshes. */
export function stashCreatedMatch(match: Match, seasonId?: string | null): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ match, seasonId: seasonId ?? match.seasonId ?? null }),
  );
}

export function consumeCreatedMatch(): StashedCreatedMatch | null {
  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'match' in parsed) {
      const entry = parsed as StashedCreatedMatch;
      return {
        match: entry.match,
        seasonId: entry.seasonId ?? entry.match.seasonId ?? null,
      };
    }

    return { match: parsed as Match, seasonId: (parsed as Match).seasonId ?? null };
  } catch {
    return null;
  }
}
