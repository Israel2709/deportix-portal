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
