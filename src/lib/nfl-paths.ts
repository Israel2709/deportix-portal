import type { League } from './types';

export type NflTab = 'coverage' | 'browse' | 'loader';

export function parseNflTab(value: string | null | undefined): NflTab {
  if (value === 'loader' || value === 'browse') return value;
  return 'coverage';
}

export function nflTabPath(tab: NflTab): string {
  return tab === 'coverage' ? '/nfl' : `/nfl?tab=${tab}`;
}

/** Browse path for an NFL league (uses external id when present). */
export function nflLeaguePath(league: Pick<League, 'id' | 'externalId'>): string {
  return `/nfl/leagues/${encodeURIComponent(league.externalId ?? league.id)}`;
}

export function nflLeagueBrowsePath(leagueId: string): string {
  return `/nfl/leagues/${encodeURIComponent(leagueId)}`;
}
