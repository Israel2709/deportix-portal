import type { Match } from './types';

export const LIGA_MX_LEAGUE_ID = '262';
export const LIGA_MX_DEFAULT_SEASON_YEAR = 2026;
export const LIGA_MX_DEFAULT_TOURNAMENTS = ['Apertura', 'Clausura'] as const;

export type LigaMxTournament = (typeof LIGA_MX_DEFAULT_TOURNAMENTS)[number];

/** Extracts the Liga MX tournament name from a match round label (e.g. "Clausura - 16"). */
export function tournamentFromRound(round: string | null): string | null {
  if (!round) return null;
  const match = round.match(/^(Apertura|Clausura)\b/i);
  if (!match) return null;
  const name = match[1]!.toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function resolveLigaMxTournaments(matches: Match[]): string[] {
  const fromMatches = new Set<string>();
  for (const match of matches) {
    const tournament = tournamentFromRound(match.round);
    if (tournament) fromMatches.add(tournament);
  }

  if (fromMatches.size === 0) return [...LIGA_MX_DEFAULT_TOURNAMENTS];

  const ordered = LIGA_MX_DEFAULT_TOURNAMENTS.filter((name) => fromMatches.has(name));
  const extras = [...fromMatches]
    .filter((name) => !LIGA_MX_DEFAULT_TOURNAMENTS.includes(name as LigaMxTournament))
    .sort();

  return [...ordered, ...extras];
}
