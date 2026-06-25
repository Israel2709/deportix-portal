import type { Match } from './types';
import { MATCH_STATUS_OPTIONS, type MatchStatus } from './match-form';

export interface MatchEditPatch {
  status?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
}

export interface MatchRowDraft {
  status: string;
  homeScore: string;
  awayScore: string;
}

const OVERRIDE_PREFIX = 'deportix.matchOverrides.v1';

function overrideKey(leagueId: string, seasonId: string): string {
  return `${OVERRIDE_PREFIX}.${leagueId}.${seasonId}`;
}

export function readMatchOverrides(
  leagueId: string,
  seasonId: string,
): Record<string, MatchEditPatch> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(overrideKey(leagueId, seasonId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, MatchEditPatch>)
      : {};
  } catch {
    return {};
  }
}

export function writeMatchOverrides(
  leagueId: string,
  seasonId: string,
  overrides: Record<string, MatchEditPatch>,
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(overrideKey(leagueId, seasonId), JSON.stringify(overrides));
}

export function saveMatchOverride(
  leagueId: string,
  seasonId: string,
  matchId: string,
  patch: MatchEditPatch,
): void {
  const existing = readMatchOverrides(leagueId, seasonId);
  writeMatchOverrides(leagueId, seasonId, { ...existing, [matchId]: patch });
}

export function applyMatchPatch(match: Match, patch?: MatchEditPatch): Match {
  if (!patch) return match;

  return {
    ...match,
    status: patch.status !== undefined ? patch.status : match.status,
    home: {
      ...match.home,
      score: patch.homeScore !== undefined ? patch.homeScore : match.home.score,
    },
    away: {
      ...match.away,
      score: patch.awayScore !== undefined ? patch.awayScore : match.away.score,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function applyMatchOverrides(
  matches: Match[],
  overrides: Record<string, MatchEditPatch>,
): Match[] {
  return matches.map((match) => applyMatchPatch(match, overrides[match.id]));
}

export function matchToDraft(match: Match): MatchRowDraft {
  return {
    status: match.status ?? 'NS',
    homeScore: match.home.score != null ? String(match.home.score) : '',
    awayScore: match.away.score != null ? String(match.away.score) : '',
  };
}

export function isDraftDirty(match: Match, draft: MatchRowDraft): boolean {
  const persisted = matchToDraft(match);
  return (
    persisted.status !== draft.status ||
    persisted.homeScore !== draft.homeScore ||
    persisted.awayScore !== draft.awayScore
  );
}

export function parseScoreInput(value: string): number | null | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) return 'invalid';
  return parsed;
}

/** Keeps only non-negative integer characters while the user types. */
export function sanitizeScoreInput(value: string): string {
  return value.replace(/\D/g, '');
}

export function draftToPatch(draft: MatchRowDraft): MatchEditPatch | string {
  const homeScore = parseScoreInput(draft.homeScore);
  if (homeScore === 'invalid') return 'El marcador local debe ser un entero mayor o igual a 0.';

  const awayScore = parseScoreInput(draft.awayScore);
  if (awayScore === 'invalid') {
    return 'El marcador visitante debe ser un entero mayor o igual a 0.';
  }

  const status = draft.status.trim();
  if (!status) return 'El estado es obligatorio.';
  if (!MATCH_STATUS_OPTIONS.includes(status as MatchStatus)) return 'El estado no es válido.';

  return {
    status,
    homeScore,
    awayScore,
  };
}

export function hasMatchOverride(
  overrides: Record<string, MatchEditPatch>,
  matchId: string,
): boolean {
  return matchId in overrides;
}

/** Maps a portal edit patch to the PATCH /v1/leagues/{leagueId}/matches/{matchId} body. */
export function matchEditPatchToApiBody(patch: MatchEditPatch): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (patch.status !== undefined) body.status = patch.status;
  if (patch.homeScore !== undefined) body.home = { score: patch.homeScore };
  if (patch.awayScore !== undefined) body.away = { score: patch.awayScore };

  return body;
}
