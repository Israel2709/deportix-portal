import type { League } from './types';

export type AmericanFootballTab = 'contenido' | 'coverage' | 'browse' | 'loader';

export function parseAmericanFootballTab(value: string | null | undefined): AmericanFootballTab {
  if (value === 'coverage' || value === 'loader' || value === 'browse') return value;
  return 'contenido';
}

export function americanFootballTabPath(tab: AmericanFootballTab): string {
  if (tab === 'contenido') return '/american-football';
  return `/american-football?tab=${tab}`;
}

/** Browse path for an American football league (canonical document id). */
export function americanFootballLeaguePath(league: Pick<League, 'id' | 'externalId'>): string {
  return `/american-football/leagues/${encodeURIComponent(league.id)}`;
}

export function americanFootballLeagueBrowsePath(leagueId: string): string {
  return `/american-football/leagues/${encodeURIComponent(leagueId)}`;
}

export function americanFootballSeasonDetailPath(leagueId: string, year: number | string): string {
  return `/american-football/seasons/${encodeURIComponent(leagueId)}/${encodeURIComponent(String(year))}`;
}

export function americanFootballTeamDetailPath(
  teamId: string,
  context?: { league?: string; season?: string | number },
): string {
  const base = `/american-football/teams/${encodeURIComponent(teamId)}`;
  if (!context?.league || context.season == null) return base;
  const qs = new URLSearchParams({ league: context.league, season: String(context.season) });
  return `${base}?${qs}`;
}

export function americanFootballGameDetailPath(gameId: string): string {
  return `/american-football/games/${encodeURIComponent(gameId)}`;
}

export function americanFootballStandingDetailPath(
  standingId: string,
  context: { league: string; season: string | number },
): string {
  const qs = new URLSearchParams({ league: context.league, season: String(context.season) });
  return `/american-football/standings/${encodeURIComponent(standingId)}?${qs}`;
}

export function americanFootballTimezoneDetailPath(timezone: string): string {
  return `/american-football/timezones/${encodeURIComponent(timezone)}`;
}
