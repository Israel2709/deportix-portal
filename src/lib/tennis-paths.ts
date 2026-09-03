export type TennisTab = 'contenido' | 'coverage' | 'loader';

export function parseTennisTab(value: string | null | undefined): TennisTab {
  if (value === 'coverage' || value === 'loader') return value;
  return 'contenido';
}

export function tennisTabPath(tab: TennisTab): string {
  if (tab === 'contenido') return '/tennis';
  return `/tennis?tab=${tab}`;
}

export function tennisTournamentDetailPath(tournamentId: string): string {
  return `/tennis/tournaments/${encodeURIComponent(tournamentId)}`;
}

export function tennisRoundDetailPath(roundId: string): string {
  return `/tennis/rounds/${encodeURIComponent(roundId)}`;
}

export function tennisMatchDetailPath(matchId: string): string {
  return `/tennis/matches/${encodeURIComponent(matchId)}`;
}
