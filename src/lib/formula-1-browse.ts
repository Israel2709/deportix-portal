import type {
  Formula1CircuitItem,
  Formula1CompetitionRef,
  Formula1RaceItem,
} from './formula-1-bff-types';

export function normalizeFormula1Country(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function countriesFromRaces(races: Formula1RaceItem[]): string[] {
  const set = new Set<string>();
  for (const race of races) {
    const country = race.circuit.country?.trim();
    if (country) set.add(country);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function countriesFromCircuits(circuits: Formula1CircuitItem[]): string[] {
  const set = new Set<string>();
  for (const circuit of circuits) {
    const country = circuit.country?.trim();
    if (country) set.add(country);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function mergeFormula1Countries(...lists: string[][]): string[] {
  const set = new Set<string>();
  for (const list of lists) {
    for (const country of list) set.add(country);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function competitionsForCountry(
  races: Formula1RaceItem[],
  country: string,
): Formula1CompetitionRef[] {
  const needle = normalizeFormula1Country(country);
  const byId = new Map<string, Formula1CompetitionRef>();
  for (const race of races) {
    if (normalizeFormula1Country(race.circuit.country) !== needle) continue;
    byId.set(race.competition.id, race.competition);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function seasonsForCompetitionInCountry(
  races: Formula1RaceItem[],
  country: string,
  competitionId: string,
): number[] {
  const needle = normalizeFormula1Country(country);
  const seasons = new Set<number>();
  for (const race of races) {
    if (normalizeFormula1Country(race.circuit.country) !== needle) continue;
    if (race.competition.id !== competitionId) continue;
    if (race.season > 0) seasons.add(race.season);
  }
  return [...seasons].sort((a, b) => b - a);
}

export function racesForBrowseSelection(
  races: Formula1RaceItem[],
  country: string,
  competitionId: string,
  season: number,
): Formula1RaceItem[] {
  const needle = normalizeFormula1Country(country);
  return races
    .filter(
      (race) =>
        normalizeFormula1Country(race.circuit.country) === needle &&
        race.competition.id === competitionId &&
        race.season === season,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function findCompetitionInCountry(
  races: Formula1RaceItem[],
  country: string,
  competitionId: string,
): Formula1CompetitionRef | null {
  return competitionsForCountry(races, country).find((item) => item.id === competitionId) ?? null;
}
