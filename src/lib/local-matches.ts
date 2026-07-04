import type { Match } from './types';
import { applyMatchPatch, type MatchEditPatch } from './match-edits';

const STORAGE_PREFIX = 'deportix.localMatches.v1';

function storageKey(leagueId: string, seasonId: string): string {
  return `${STORAGE_PREFIX}.${leagueId}.${seasonId}`;
}

export function readLocalMatches(leagueId: string, seasonId: string): Match[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(storageKey(leagueId, seasonId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Match[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalMatch(leagueId: string, seasonId: string, match: Match): void {
  if (typeof window === 'undefined') return;
  const existing = readLocalMatches(leagueId, seasonId);
  writeLocalMatches(leagueId, seasonId, [match, ...existing]);
}

export function writeLocalMatches(leagueId: string, seasonId: string, matches: Match[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(leagueId, seasonId), JSON.stringify(matches));
}

export function updateLocalMatch(
  leagueId: string,
  seasonId: string,
  matchId: string,
  patch: MatchEditPatch,
): void {
  const matches = readLocalMatches(leagueId, seasonId);
  writeLocalMatches(
    leagueId,
    seasonId,
    matches.map((match) => (match.id === matchId ? applyMatchPatch(match, patch) : match)),
  );
}

export function removeLocalMatch(leagueId: string, seasonId: string, matchId: string): void {
  const matches = readLocalMatches(leagueId, seasonId);
  writeLocalMatches(
    leagueId,
    seasonId,
    matches.filter((match) => match.id !== matchId),
  );
}

export function isLocalMatch(match: Match): boolean {
  return match.id.startsWith('local_');
}
