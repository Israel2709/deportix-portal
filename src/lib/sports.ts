export const AMERICAN_FOOTBALL_SPORT_SLUG = 'american-football';
export const AMERICAN_FOOTBALL_SPORT_LABEL = 'Football americano';

/** User-facing path for a sport page (slug preferred, id as fallback). */
export function sportPath(slugOrId: string): string {
  if (slugOrId === AMERICAN_FOOTBALL_SPORT_SLUG) return '/american-football';
  return `/deportes/${encodeURIComponent(slugOrId)}`;
}

/** User-facing sport name (overrides legacy API labels like "NFL"). */
export function sportDisplayName(slugOrId: string | null | undefined, apiName?: string | null): string {
  if (slugOrId === AMERICAN_FOOTBALL_SPORT_SLUG) return AMERICAN_FOOTBALL_SPORT_LABEL;
  return apiName?.trim() || slugOrId || '—';
}
