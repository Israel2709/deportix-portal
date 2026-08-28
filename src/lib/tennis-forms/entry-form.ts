import type { TennisEntryItem, TennisEntryNestedCreate } from '../tennis-bff-types';
import { parseOptionalInt, requireCanonicalId } from './shared';

export interface TennisEntryFormValues {
  id: string;
  tournamentId: string;
  playerId: string;
  seed: string;
  ranking: string;
  entryType: string;
  queryTournamentId: string;
}

export const EMPTY_TENNIS_ENTRY_FORM: TennisEntryFormValues = {
  id: '',
  tournamentId: '',
  playerId: '',
  seed: '',
  ranking: '',
  entryType: 'direct',
  queryTournamentId: '',
};

export const TENNIS_ENTRY_TYPE_OPTIONS = [
  { value: '', label: 'Sin especificar' },
  { value: 'direct', label: 'Directo' },
  { value: 'qualifier', label: 'Qualifying' },
  { value: 'wildcard', label: 'Wildcard' },
  { value: 'lucky_loser', label: 'Lucky loser' },
  { value: 'protected_ranking', label: 'Protected ranking' },
  { value: 'bye', label: 'BYE' },
  { value: 'other', label: 'Otro' },
];

export function entryToFormValues(item: TennisEntryItem, queryTournamentId = ''): TennisEntryFormValues {
  return {
    id: item.id,
    tournamentId: item.tournamentId,
    playerId: item.player.id,
    seed: item.seed != null ? String(item.seed) : '',
    ranking: item.ranking != null ? String(item.ranking) : '',
    entryType: item.entryType ?? '',
    queryTournamentId: queryTournamentId || item.tournamentId,
  };
}

export function validateTennisEntryForm(
  values: TennisEntryFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') {
    if (requireCanonicalId(values.queryTournamentId, 'Torneo') === 'invalid') {
      return 'Selecciona un torneo para consultar entradas.';
    }
    return null;
  }
  if (mode === 'delete') {
    if (requireCanonicalId(values.id, 'ID') === 'invalid') {
      return 'Selecciona una entrada de la lista para eliminar.';
    }
    return null;
  }
  const tournamentId = mode === 'create' ? values.tournamentId : values.queryTournamentId;
  if (requireCanonicalId(tournamentId, 'Torneo') === 'invalid') {
    return 'Selecciona un torneo válido.';
  }
  if (requireCanonicalId(values.playerId, 'Jugador') === 'invalid') {
    return 'Selecciona un jugador válido.';
  }
  if (parseOptionalInt(values.seed) === 'invalid') return 'La seed debe ser un entero.';
  if (parseOptionalInt(values.ranking) === 'invalid') return 'El ranking debe ser un entero.';
  if (mode === 'edit' && requireCanonicalId(values.id, 'ID') === 'invalid') {
    return 'Selecciona una entrada de la lista para editar.';
  }
  return null;
}

export function buildTennisEntryBody(values: TennisEntryFormValues): TennisEntryNestedCreate {
  const seed = parseOptionalInt(values.seed);
  const ranking = parseOptionalInt(values.ranking);
  return {
    playerId: values.playerId.trim(),
    seed: seed === 'invalid' ? null : seed,
    ranking: ranking === 'invalid' ? null : ranking,
    entryType: values.entryType.trim()
      ? (values.entryType as TennisEntryNestedCreate['entryType'])
      : null,
  };
}
