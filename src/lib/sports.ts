export const AMERICAN_FOOTBALL_SPORT_SLUG = 'american-football';
export const AMERICAN_FOOTBALL_SPORT_LABEL = 'Football americano';

export const FORMULA_1_SPORT_SLUG = 'f1';
export const FORMULA_1_SPORT_LABEL = 'Formula 1';

export const TENNIS_SPORT_SLUG = 'tennis';
export const TENNIS_SPORT_LABEL = 'Tenis';

/** User-facing path for a sport page (slug preferred, id as fallback). */
export function sportPath(slugOrId: string): string {
  if (slugOrId === AMERICAN_FOOTBALL_SPORT_SLUG) return '/american-football';
  if (slugOrId === FORMULA_1_SPORT_SLUG) return '/formula-1';
  if (slugOrId === TENNIS_SPORT_SLUG) return '/tennis';
  return `/deportes/${encodeURIComponent(slugOrId)}`;
}

/** User-facing sport name (overrides legacy API labels like "NFL"). */
export function sportDisplayName(slugOrId: string | null | undefined, apiName?: string | null): string {
  if (slugOrId === AMERICAN_FOOTBALL_SPORT_SLUG) return AMERICAN_FOOTBALL_SPORT_LABEL;
  if (slugOrId === FORMULA_1_SPORT_SLUG) return FORMULA_1_SPORT_LABEL;
  if (slugOrId === TENNIS_SPORT_SLUG) return TENNIS_SPORT_LABEL;
  return apiName?.trim() || slugOrId || '—';
}
