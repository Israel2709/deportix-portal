import { datetimeLocalToIso, isoToDatetimeLocal } from '../match-form';
import type { Formula1RaceCreate, Formula1RaceItem } from '../formula-1-bff-types';
import { nullableString, parseOptionalInt, parseRequiredInt, requireCanonicalId } from './shared';

export interface Formula1RaceFormValues {
  id: string;
  competitionId: string;
  circuitId: string;
  season: string;
  type: string;
  date: string;
  status: string;
  timezone: string;
  distance: string;
  lapsCurrent: string;
  lapsTotal: string;
  querySeason: string;
}

export const EMPTY_FORMULA_1_RACE_FORM: Formula1RaceFormValues = {
  id: '',
  competitionId: '',
  circuitId: '',
  season: '',
  type: 'Race',
  date: '',
  status: 'Scheduled',
  timezone: 'utc',
  distance: '',
  lapsCurrent: '',
  lapsTotal: '',
  querySeason: '',
};

export function raceToFormValues(item: Formula1RaceItem, querySeason = ''): Formula1RaceFormValues {
  return {
    id: item.id,
    competitionId: item.competition.id,
    circuitId: item.circuit.id,
    season: String(item.season),
    type: item.type,
    date: isoToDatetimeLocal(item.date),
    status: item.status,
    timezone: item.timezone ?? 'utc',
    distance: item.distance ?? '',
    lapsCurrent: item.laps?.current != null ? String(item.laps.current) : '',
    lapsTotal: item.laps?.total != null ? String(item.laps.total) : '',
    querySeason: querySeason || String(item.season),
  };
}

export function validateFormula1RaceForm(
  values: Formula1RaceFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') {
    if (parseRequiredInt(values.querySeason, 'Temporada') === 'invalid') {
      return 'Indica la temporada (año) para consultar.';
    }
    return null;
  }
  if (mode === 'delete') {
    if (requireCanonicalId(values.id, 'ID') === 'invalid') {
      return 'Selecciona una carrera de la lista para eliminar.';
    }
    return null;
  }
  if (requireCanonicalId(values.competitionId, 'Competición') === 'invalid') {
    return 'Selecciona una competición válida.';
  }
  if (requireCanonicalId(values.circuitId, 'Circuito') === 'invalid') {
    return 'Selecciona un circuito válido.';
  }
  if (parseRequiredInt(values.season, 'Temporada') === 'invalid') {
    return 'La temporada (año) es obligatoria.';
  }
  if (!values.type.trim()) return 'El tipo de sesión es obligatorio.';
  if (!values.status.trim()) return 'El estado es obligatorio.';
  if (!datetimeLocalToIso(values.date)) return 'La fecha y hora (UTC) son obligatorias.';
  if (parseOptionalInt(values.lapsCurrent) === 'invalid') return 'Vueltas actuales debe ser un entero.';
  if (parseOptionalInt(values.lapsTotal) === 'invalid') return 'Vueltas totales debe ser un entero.';
  if (mode === 'edit' && requireCanonicalId(values.id, 'ID') === 'invalid') {
    return 'Selecciona una carrera de la lista para editar.';
  }
  return null;
}

export function buildFormula1RaceBody(values: Formula1RaceFormValues): Formula1RaceCreate {
  const season = parseRequiredInt(values.season, 'Temporada');
  const lapsCurrent = parseOptionalInt(values.lapsCurrent);
  const lapsTotal = parseOptionalInt(values.lapsTotal);
  const date = datetimeLocalToIso(values.date) ?? values.date.trim();
  return {
    competitionId: values.competitionId.trim(),
    circuitId: values.circuitId.trim(),
    season: season === 'invalid' ? 0 : season,
    type: values.type.trim(),
    date,
    status: values.status.trim(),
    timezone: nullableString(values.timezone) ?? 'utc',
    distance: nullableString(values.distance),
    laps: {
      current: lapsCurrent === 'invalid' ? null : lapsCurrent,
      total: lapsTotal === 'invalid' ? null : lapsTotal,
    },
  };
}
