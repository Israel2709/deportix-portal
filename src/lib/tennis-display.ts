import type { TennisCategory, TennisGender, TennisTournamentItem } from './tennis-bff-types';

export const TENNIS_TOURNAMENT_CATEGORY_LABELS: Record<TennisCategory, string> = {
  grand_slam: 'Grand Slam',
  atp_1000: 'ATP 1000',
  wta_1000: 'WTA 1000',
};

/** Circuit label shown in tournament pickers (ATP / WTA). */
export function tennisTournamentCircuitLabel(gender: TennisGender): string {
  return gender === 'female' ? 'WTA' : 'ATP';
}

export interface FormatTennisTournamentLabelOptions {
  /** How to append publish state. Default: `(borrador)` when unpublished. */
  publishedStyle?: 'paren' | 'dot' | 'none';
}

/** Human-readable tournament label for selects and lists. */
export function formatTennisTournamentLabel(
  tournament: Pick<TennisTournamentItem, 'name' | 'year' | 'gender' | 'category' | 'published'>,
  options: FormatTennisTournamentLabelOptions = {},
): string {
  const { publishedStyle = 'paren' } = options;
  const circuit = tennisTournamentCircuitLabel(tournament.gender);
  const category =
    TENNIS_TOURNAMENT_CATEGORY_LABELS[tournament.category] ?? tournament.category;
  let label = `${tournament.name} ${tournament.year} · ${circuit} · ${category}`;

  if (publishedStyle === 'none') return label;

  if (tournament.published) {
    if (publishedStyle === 'dot') label += ' · publicado';
  } else if (publishedStyle === 'dot') {
    label += ' · borrador';
  } else {
    label += ' (borrador)';
  }

  return label;
}

export function tennisTournamentToSelectOption(
  tournament: TennisTournamentItem,
  options?: FormatTennisTournamentLabelOptions,
): { value: string; label: string } {
  return {
    value: tournament.id,
    label: formatTennisTournamentLabel(tournament, options),
  };
}

/** Client-side filter for Contenido search (name, city, dates, country, category, year…). */
export function filterTennisTournaments(
  tournaments: TennisTournamentItem[],
  query: string,
): TennisTournamentItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return tournaments;

  return tournaments.filter((item) => {
    const circuit = tennisTournamentCircuitLabel(item.gender);
    const category = TENNIS_TOURNAMENT_CATEGORY_LABELS[item.category] ?? item.category;
    const haystack = [
      item.name,
      item.shortName,
      item.city,
      item.country.code,
      item.country.name,
      item.startDate,
      item.endDate,
      String(item.year),
      item.status,
      item.category,
      category,
      item.gender,
      circuit,
      item.published ? 'publicado' : 'borrador',
    ]
      .filter(Boolean)
      .map((part) => String(part).toLowerCase());

    return haystack.some((part) => part.includes(needle));
  });
}
