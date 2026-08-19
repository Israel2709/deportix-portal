export type Formula1Tab = 'contenido' | 'coverage' | 'browse' | 'loader';

export function parseFormula1Tab(value: string | null | undefined): Formula1Tab {
  if (value === 'coverage' || value === 'loader' || value === 'browse') return value;
  return 'contenido';
}

export function formula1TabPath(tab: Formula1Tab): string {
  if (tab === 'contenido') return '/formula-1';
  return `/formula-1?tab=${tab}`;
}

export function formula1CompetitionDetailPath(competitionId: string): string {
  return `/formula-1/competitions/${encodeURIComponent(competitionId)}`;
}

export function formula1CircuitDetailPath(circuitId: string): string {
  return `/formula-1/circuits/${encodeURIComponent(circuitId)}`;
}

export function formula1TeamDetailPath(teamId: string): string {
  return `/formula-1/teams/${encodeURIComponent(teamId)}`;
}

export function formula1DriverDetailPath(driverId: string): string {
  return `/formula-1/drivers/${encodeURIComponent(driverId)}`;
}

export function formula1RaceDetailPath(raceId: string): string {
  return `/formula-1/races/${encodeURIComponent(raceId)}`;
}

export function formula1SeasonBrowsePath(year: number | string): string {
  return `/formula-1/seasons/${encodeURIComponent(String(year))}`;
}

export interface Formula1BrowseParams {
  country?: string;
  competition?: string;
  season?: string | number;
}

export function formula1BrowsePath(params: Formula1BrowseParams = {}): string {
  const qs = new URLSearchParams({ tab: 'browse' });
  if (params.country?.trim()) qs.set('country', params.country.trim());
  if (params.competition?.trim()) qs.set('competition', params.competition.trim());
  if (params.season != null && String(params.season).trim() !== '') {
    qs.set('season', String(params.season).trim());
  }
  return `/formula-1?${qs.toString()}`;
}

export function parseFormula1BrowseParams(searchParams: {
  country?: string | null;
  competition?: string | null;
  season?: string | null;
}): Required<Formula1BrowseParams> | Formula1BrowseParams {
  const country = searchParams.country?.trim() || undefined;
  const competition = searchParams.competition?.trim() || undefined;
  const season = searchParams.season?.trim() || undefined;
  return { country, competition, season };
}
