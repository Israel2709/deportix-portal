import type { Match, Team } from './types';
import { datetimeLocalToIso, isoToDatetimeLocal, MATCH_STATUS_OPTIONS, type MatchStatus } from './match-form';

export interface MatchEditPatch {
  date?: string | null;
  round?: string | null;
  venue?: string | null;
  seasonId?: string | null;
  status?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
}

export interface MatchRowDraft {
  date: string;
  round: string;
  venue: string;
  seasonId: string;
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: string;
  awayScore: string;
}

const OVERRIDE_PREFIX = 'deportix.matchOverrides.v1';

function overrideKey(leagueId: string, seasonId: string): string {
  return `${OVERRIDE_PREFIX}.${leagueId}.${seasonId}`;
}

function resolveTeamSide(
  current: Match['home'],
  teamId: string | null | undefined,
  teams: Team[],
): Match['home'] {
  if (teamId === undefined) return current;
  const team = teams.find((item) => item.id === teamId);
  return {
    teamId,
    name: team?.name ?? current.name,
    logo: team?.logo ?? current.logo,
    score: current.score,
  };
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

export function applyMatchPatch(match: Match, patch?: MatchEditPatch, teams: Team[] = []): Match {
  if (!patch) return match;

  let home = match.home;
  let away = match.away;

  if (patch.homeTeamId !== undefined) {
    home = resolveTeamSide(home, patch.homeTeamId, teams);
  }
  if (patch.awayTeamId !== undefined) {
    away = resolveTeamSide(away, patch.awayTeamId, teams);
  }
  if (patch.homeScore !== undefined) {
    home = { ...home, score: patch.homeScore };
  }
  if (patch.awayScore !== undefined) {
    away = { ...away, score: patch.awayScore };
  }

  return {
    ...match,
    date: patch.date !== undefined ? patch.date : match.date,
    round: patch.round !== undefined ? patch.round : match.round,
    venue: patch.venue !== undefined ? patch.venue : match.venue,
    seasonId: patch.seasonId !== undefined ? patch.seasonId : match.seasonId,
    status: patch.status !== undefined ? patch.status : match.status,
    home,
    away,
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
    date: isoToDatetimeLocal(match.date),
    round: match.round ?? '',
    venue: match.venue ?? '',
    seasonId: match.seasonId ?? '',
    status: match.status ?? 'NS',
    homeTeamId: match.home.teamId ?? '',
    awayTeamId: match.away.teamId ?? '',
    homeScore: match.home.score != null ? String(match.home.score) : '',
    awayScore: match.away.score != null ? String(match.away.score) : '',
  };
}

export function isDraftDirty(match: Match, draft: MatchRowDraft): boolean {
  const persisted = matchToDraft(match);
  return (
    persisted.date !== draft.date ||
    persisted.round !== draft.round ||
    persisted.venue !== draft.venue ||
    persisted.seasonId !== draft.seasonId ||
    persisted.status !== draft.status ||
    persisted.homeTeamId !== draft.homeTeamId ||
    persisted.awayTeamId !== draft.awayTeamId ||
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
  if (!draft.date.trim()) return 'La fecha y hora son obligatorias.';
  const date = datetimeLocalToIso(draft.date);
  if (!date) return 'La fecha y hora no son válidas.';

  if (!draft.seasonId.trim()) return 'Selecciona una temporada.';
  if (!draft.homeTeamId.trim()) return 'Selecciona el equipo local.';
  if (!draft.awayTeamId.trim()) return 'Selecciona el equipo visitante.';
  if (draft.homeTeamId === draft.awayTeamId) {
    return 'Local y visitante deben ser equipos distintos.';
  }

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
    date,
    round: draft.round.trim() || null,
    venue: draft.venue.trim() || null,
    seasonId: draft.seasonId.trim(),
    status,
    homeTeamId: draft.homeTeamId.trim(),
    awayTeamId: draft.awayTeamId.trim(),
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

  if (patch.date !== undefined) body.date = patch.date;
  if (patch.round !== undefined) body.round = patch.round;
  if (patch.venue !== undefined) body.venue = patch.venue;
  if (patch.seasonId !== undefined) body.seasonId = patch.seasonId;
  if (patch.status !== undefined) body.status = patch.status;

  const home: Record<string, unknown> = {};
  const away: Record<string, unknown> = {};
  if (patch.homeTeamId !== undefined) home.teamId = patch.homeTeamId;
  if (patch.homeScore !== undefined) home.score = patch.homeScore;
  if (patch.awayTeamId !== undefined) away.teamId = patch.awayTeamId;
  if (patch.awayScore !== undefined) away.score = patch.awayScore;
  if (Object.keys(home).length > 0) body.home = home;
  if (Object.keys(away).length > 0) body.away = away;

  return body;
}
