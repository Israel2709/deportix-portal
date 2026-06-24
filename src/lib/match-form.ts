import type { Match, Team } from './types';

export const MATCH_STATUS_OPTIONS = [
  'NS',
  '1H',
  'HT',
  '2H',
  'ET',
  'BT',
  'P',
  'LIVE',
  'INT',
  'FT',
  'AET',
  'PEN',
] as const;

export type MatchStatus = (typeof MATCH_STATUS_OPTIONS)[number];

/** Etiquetas en español para los códigos de estado de partido (API-Football / Deportix). */
export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  NS: 'No iniciado',
  '1H': 'Primer tiempo',
  HT: 'Medio tiempo',
  '2H': 'Segundo tiempo',
  ET: 'Tiempo extra',
  BT: 'Descanso',
  P: 'Penales en curso',
  LIVE: 'En vivo',
  INT: 'Interrumpido',
  FT: 'Finalizado',
  AET: 'Finalizado (tiempo extra)',
  PEN: 'Finalizado (penales)',
};

export function formatMatchStatusOption(status: MatchStatus): string {
  return `${status} — ${MATCH_STATUS_LABELS[status]}`;
}

export interface MatchFormValues {
  date: string;
  status: MatchStatus;
  round: string;
  venue: string;
  homeTeamId: string;
  homeScore: string;
  awayTeamId: string;
  awayScore: string;
}

export const EMPTY_MATCH_FORM: MatchFormValues = {
  date: '',
  status: 'NS',
  round: '',
  venue: '',
  homeTeamId: '',
  homeScore: '',
  awayTeamId: '',
  awayScore: '',
};

export interface MatchFormContext {
  sport: string | null;
  leagueId: string;
  seasonId: string;
}

function parseOptionalScore(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function toIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function validateMatchForm(values: MatchFormValues): string | null {
  if (!values.date.trim()) return 'La fecha es obligatoria.';
  if (!toIsoDate(values.date)) return 'La fecha no es válida.';
  if (!values.homeTeamId) return 'Selecciona el equipo local.';
  if (!values.awayTeamId) return 'Selecciona el equipo visitante.';
  if (values.homeTeamId === values.awayTeamId) {
    return 'Local y visitante deben ser equipos distintos.';
  }
  if (values.homeScore.trim() && parseOptionalScore(values.homeScore) === null) {
    return 'El marcador local debe ser un entero mayor o igual a 0.';
  }
  if (values.awayScore.trim() && parseOptionalScore(values.awayScore) === null) {
    return 'El marcador visitante debe ser un entero mayor o igual a 0.';
  }
  return null;
}

function teamSide(team: Team | undefined, score: string): Match['home'] {
  return {
    teamId: team?.id ?? null,
    name: team?.name ?? null,
    logo: team?.logo ?? null,
    score: parseOptionalScore(score),
  };
}

export function resolveMatchVenue(values: MatchFormValues, homeTeam: Team | undefined): string | null {
  const trimmed = values.venue.trim();
  if (trimmed) return trimmed;
  return homeTeam?.venue?.name?.trim() ?? null;
}

export function buildMatchFromForm(
  values: MatchFormValues,
  context: MatchFormContext,
  teams: Team[],
): Match {
  const homeTeam = teams.find((team) => team.id === values.homeTeamId);
  const awayTeam = teams.find((team) => team.id === values.awayTeamId);
  const now = new Date().toISOString();
  const localId = crypto.randomUUID();

  return {
    id: `local_${localId}`,
    externalId: localId,
    sport: context.sport,
    leagueId: context.leagueId,
    seasonId: context.seasonId,
    date: toIsoDate(values.date),
    status: values.status,
    round: values.round.trim() || null,
    venue: resolveMatchVenue(values, homeTeam),
    home: teamSide(homeTeam, values.homeScore),
    away: teamSide(awayTeam, values.awayScore),
    updatedAt: now,
  };
}

export function addMatchFormPath(leagueId: string, seasonYear: number | null): string {
  const base = `/leagues/${encodeURIComponent(leagueId)}/partidos/nuevo`;
  return seasonYear !== null ? `${base}?season=${seasonYear}` : base;
}
