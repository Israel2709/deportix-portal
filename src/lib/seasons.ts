import type { Season } from './types';

export function seasonLabel(season: Season): string {
  return String(season.year ?? season.externalId ?? season.id);
}

/** Prefer the league's current season; otherwise the first item (API sorts newest first). */
export function pickDefaultSeason(seasons: Season[]): Season | null {
  if (seasons.length === 0) return null;
  return seasons.find((season) => season.current) ?? seasons[0] ?? null;
}
