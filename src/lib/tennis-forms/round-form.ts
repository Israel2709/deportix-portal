import type { TennisRoundItem, TennisRoundNestedCreate } from '../tennis-bff-types';
import { nullableString, parseRequiredInt, requireCanonicalId } from './shared';

export interface TennisRoundFormValues {
  id: string;
  tournamentId: string;
  roundNumber: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  queryTournamentId: string;
}

export const EMPTY_TENNIS_ROUND_FORM: TennisRoundFormValues = {
  id: '',
  tournamentId: '',
  roundNumber: '1',
  name: '',
  status: 'pending',
  startDate: '',
  endDate: '',
  queryTournamentId: '',
};

export const TENNIS_ROUND_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activa' },
  { value: 'finished', label: 'Finalizada' },
];

export function roundToFormValues(item: TennisRoundItem, queryTournamentId = ''): TennisRoundFormValues {
  return {
    id: item.id,
    tournamentId: item.tournamentId,
    roundNumber: String(item.roundNumber),
    name: item.name,
    status: item.status,
    startDate: item.startDate ?? '',
    endDate: item.endDate ?? '',
    queryTournamentId: queryTournamentId || item.tournamentId,
  };
}

export function validateTennisRoundForm(
  values: TennisRoundFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') {
    if (requireCanonicalId(values.queryTournamentId, 'Torneo') === 'invalid') {
      return 'Selecciona un torneo para consultar rondas.';
    }
    return null;
  }
  if (mode === 'delete') {
    if (requireCanonicalId(values.id, 'ID') === 'invalid') {
      return 'Selecciona una ronda de la lista para eliminar.';
    }
    return null;
  }
  const tournamentId = mode === 'create' ? values.tournamentId : values.queryTournamentId;
  if (requireCanonicalId(tournamentId, 'Torneo') === 'invalid') {
    return 'Selecciona un torneo válido.';
  }
  if (parseRequiredInt(values.roundNumber, 'Número de ronda') === 'invalid') {
    return 'El número de ronda es obligatorio.';
  }
  if (!values.name.trim()) return 'El nombre de la ronda es obligatorio.';
  if (mode === 'edit' && requireCanonicalId(values.id, 'ID') === 'invalid') {
    return 'Selecciona una ronda de la lista para editar.';
  }
  return null;
}

export function buildTennisRoundBody(values: TennisRoundFormValues): TennisRoundNestedCreate {
  const roundNumber = parseRequiredInt(values.roundNumber, 'Número de ronda');
  return {
    roundNumber: roundNumber === 'invalid' ? 1 : roundNumber,
    name: values.name.trim(),
    status: values.status as TennisRoundNestedCreate['status'],
    startDate: nullableString(values.startDate),
    endDate: nullableString(values.endDate),
  };
}
