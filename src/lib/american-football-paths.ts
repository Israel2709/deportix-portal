import type { League } from './types';

export type AmericanFootballTab = 'coverage' | 'browse' | 'loader';

export function parseAmericanFootballTab(value: string | null | undefined): AmericanFootballTab {
  if (value === 'loader' || value === 'browse') return value;
  return 'coverage';
}

export function americanFootballTabPath(tab: AmericanFootballTab): string {
  return tab === 'coverage' ? '/american-football' : `/american-football?tab=${tab}`;
}

/** Browse path for an American football league (uses external id when present). */
export function americanFootballLeaguePath(league: Pick<League, 'id' | 'externalId'>): string {
  return `/american-football/leagues/${encodeURIComponent(league.externalId ?? league.id)}`;
}

export function americanFootballLeagueBrowsePath(leagueId: string): string {
  return `/american-football/leagues/${encodeURIComponent(leagueId)}`;
}
