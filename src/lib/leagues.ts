import type { League } from './types';

/** User-facing path for a league detail page. */
export function leaguePath(league: Pick<League, 'id' | 'externalId'>): string {
  if (league.externalId === '262') return '/liga-mx';
  return `/leagues/${encodeURIComponent(league.externalId ?? league.id)}`;
}

export function filterLeaguesByQuery(leagues: League[], query: string): League[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return leagues;

  return leagues.filter((league) => {
    const name = (league.name ?? '').toLowerCase();
    const country = (league.country ?? '').toLowerCase();
    return name.includes(normalized) || country.includes(normalized);
  });
}
