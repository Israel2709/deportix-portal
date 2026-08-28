import { datetimeLocalToIso, isoToDatetimeLocal } from '../match-form';
import type {
  TennisMatchCreate,
  TennisMatchItem,
  TennisMatchNestedCreate,
  TennisPlayerRef,
} from '../tennis-bff-types';
import { nullableString, parseRequiredInt, requireCanonicalId } from './shared';

export interface TennisMatchFormValues {
  id: string;
  tournamentId: string;
  roundId: string;
  bracketPosition: string;
  competitor1Id: string;
  competitor2Id: string;
  scheduledAt: string;
  timezone: string;
  court: string;
  status: string;
  competitor1SourceMatchId: string;
  competitor2SourceMatchId: string;
  winnerToMatchId: string;
  winnerToPosition: string;
  competitor1EntryType: string;
  competitor2EntryType: string;
  queryTournamentId: string;
}

export const EMPTY_TENNIS_MATCH_FORM: TennisMatchFormValues = {
  id: '',
  tournamentId: '',
  roundId: '',
  bracketPosition: '1',
  competitor1Id: '',
  competitor2Id: '',
  scheduledAt: '',
  timezone: 'utc',
  court: '',
  status: 'pending_competitors',
  competitor1SourceMatchId: '',
  competitor2SourceMatchId: '',
  winnerToMatchId: '',
  winnerToPosition: '',
  competitor1EntryType: '',
  competitor2EntryType: '',
  queryTournamentId: '',
};

export const TENNIS_MATCH_STATUS_OPTIONS = [
  { value: 'pending_competitors', label: 'Competidores pendientes' },
  { value: 'scheduled', label: 'Programado' },
  { value: 'live', label: 'En juego' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'postponed', label: 'Reprogramado' },
  { value: 'finished', label: 'Finalizado' },
  { value: 'retirement', label: 'Retiro' },
  { value: 'walkover', label: 'Walkover' },
  { value: 'disqualification', label: 'Descalificación' },
  { value: 'cancelled', label: 'Cancelado' },
];

export const TENNIS_WINNER_TO_POSITION_OPTIONS = [
  { value: '', label: 'Sin destino' },
  { value: 'competitor_1', label: 'Competidor 1 del siguiente partido' },
  { value: 'competitor_2', label: 'Competidor 2 del siguiente partido' },
];

export function formatTennisMatchLabel(match: TennisMatchItem): string {
  const c1 = match.competitor1?.displayName ?? 'TBD';
  const c2 = match.competitor2?.displayName ?? 'TBD';
  const round = match.roundName ?? `R${match.roundNumber}`;
  return `${round} · pos ${match.bracketPosition} · ${c1} vs ${c2}`;
}

export function matchToFormValues(item: TennisMatchItem, queryTournamentId = ''): TennisMatchFormValues {
  return {
    id: item.id,
    tournamentId: item.tournamentId,
    roundId: item.roundId,
    bracketPosition: String(item.bracketPosition),
    competitor1Id: item.competitor1?.id ?? '',
    competitor2Id: item.competitor2?.id ?? '',
    scheduledAt: item.scheduledAt ? isoToDatetimeLocal(item.scheduledAt) : '',
    timezone: item.timezone ?? 'utc',
    court: item.court ?? '',
    status: item.status,
    competitor1SourceMatchId: item.bracket.competitor1SourceMatchId ?? '',
    competitor2SourceMatchId: item.bracket.competitor2SourceMatchId ?? '',
    winnerToMatchId: item.bracket.winnerToMatchId ?? '',
    winnerToPosition: item.bracket.winnerToPosition ?? '',
    competitor1EntryType: item.bracket.competitor1EntryType ?? '',
    competitor2EntryType: item.bracket.competitor2EntryType ?? '',
    queryTournamentId: queryTournamentId || item.tournamentId,
  };
}

export function validateTennisMatchForm(
  values: TennisMatchFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') {
    if (requireCanonicalId(values.queryTournamentId, 'Torneo') === 'invalid') {
      return 'Selecciona un torneo para consultar partidos.';
    }
    return null;
  }
  if (mode === 'delete') {
    if (requireCanonicalId(values.id, 'ID') === 'invalid') {
      return 'Selecciona un partido de la lista para eliminar.';
    }
    return null;
  }
  const tournamentId = mode === 'create' ? values.tournamentId : values.queryTournamentId;
  if (requireCanonicalId(tournamentId, 'Torneo') === 'invalid') {
    return 'Selecciona un torneo válido.';
  }
  if (requireCanonicalId(values.roundId, 'Ronda') === 'invalid') {
    return 'Selecciona una ronda válida.';
  }
  if (parseRequiredInt(values.bracketPosition, 'Posición en bracket') === 'invalid') {
    return 'La posición en el bracket es obligatoria.';
  }
  if (
    values.competitor1Id.trim() &&
    values.competitor2Id.trim() &&
    values.competitor1Id.trim() === values.competitor2Id.trim()
  ) {
    return 'Los dos competidores no pueden ser el mismo jugador.';
  }
  if (values.scheduledAt.trim() && !datetimeLocalToIso(values.scheduledAt)) {
    return 'La fecha programada no es válida.';
  }
  if (mode === 'edit' && requireCanonicalId(values.id, 'ID') === 'invalid') {
    return 'Selecciona un partido de la lista para editar.';
  }
  return null;
}

function optionalId(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function optionalEntryType(value: string): TennisMatchCreate['competitor1EntryType'] {
  const trimmed = value.trim();
  return trimmed ? (trimmed as TennisMatchCreate['competitor1EntryType']) : null;
}

function bracketFields(values: TennisMatchFormValues) {
  return {
    competitor1SourceMatchId: optionalId(values.competitor1SourceMatchId),
    competitor2SourceMatchId: optionalId(values.competitor2SourceMatchId),
    winnerToMatchId: optionalId(values.winnerToMatchId),
    winnerToPosition: values.winnerToPosition.trim()
      ? (values.winnerToPosition as NonNullable<TennisMatchCreate['winnerToPosition']>)
      : null,
    competitor1EntryType: optionalEntryType(values.competitor1EntryType),
    competitor2EntryType: optionalEntryType(values.competitor2EntryType),
  };
}

export function buildTennisMatchBody(values: TennisMatchFormValues): TennisMatchCreate {
  const bracketPosition = parseRequiredInt(values.bracketPosition, 'Posición');
  const scheduledAt = values.scheduledAt.trim() ? datetimeLocalToIso(values.scheduledAt) : null;
  return {
    tournamentId: values.tournamentId.trim(),
    roundId: values.roundId.trim(),
    bracketPosition: bracketPosition === 'invalid' ? 1 : bracketPosition,
    competitor1Id: optionalId(values.competitor1Id),
    competitor2Id: optionalId(values.competitor2Id),
    scheduledAt,
    timezone: nullableString(values.timezone) ?? 'utc',
    court: nullableString(values.court),
    status: values.status as TennisMatchCreate['status'],
    ...bracketFields(values),
  };
}

export function buildTennisMatchUpdateBody(values: TennisMatchFormValues): TennisMatchNestedCreate {
  const bracketPosition = parseRequiredInt(values.bracketPosition, 'Posición');
  const scheduledAt = values.scheduledAt.trim() ? datetimeLocalToIso(values.scheduledAt) : null;
  return {
    roundId: values.roundId.trim(),
    bracketPosition: bracketPosition === 'invalid' ? undefined : bracketPosition,
    competitor1Id: optionalId(values.competitor1Id),
    competitor2Id: optionalId(values.competitor2Id),
    scheduledAt,
    timezone: nullableString(values.timezone) ?? 'utc',
    court: nullableString(values.court),
    status: values.status as TennisMatchNestedCreate['status'],
    ...bracketFields(values),
  };
}

export function playerRefOptions(players: TennisPlayerRef[]): { value: string; label: string }[] {
  return [
    { value: '', label: 'TBD / sin asignar' },
    ...players.map((p) => ({ value: p.id, label: `${p.displayName} (${p.country.code})` })),
  ];
}

export function matchRefOptions(
  matches: TennisMatchItem[],
  excludeId?: string,
): { value: string; label: string }[] {
  return [
    { value: '', label: 'Ninguno' },
    ...matches
      .filter((m) => m.id !== excludeId)
      .map((m) => ({ value: m.id, label: formatTennisMatchLabel(m) })),
  ];
}
