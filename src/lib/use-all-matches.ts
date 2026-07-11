'use client';

/**
 * @deprecated Prefer `useLeagueMatchesQuery` from `@/lib/query/hooks/league`.
 * Retained for legacy call sites and cache update helpers (`applyUpdates`, etc.).
 */
import { useAllMatches } from '@/lib/query/use-all-matches-query';

export { leagueMatchesPagePath } from './use-all-matches-path';
export { useAllMatches };
