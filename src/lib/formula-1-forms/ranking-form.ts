import type {
  Formula1DriverRankingCreate,
  Formula1RaceRankingCreate,
  Formula1TeamRankingCreate,
} from '../formula-1-bff-types';
import { nullableString, parseOptionalInt, parseRequiredInt, requireCanonicalId } from './shared';

export interface Formula1DriverRankingFormValues {
  rankingId: string;
  driverId: string;
  season: string;
  position: string;
  points: string;
  wins: string;
  behind: string;
  querySeason: string;
}

export const EMPTY_FORMULA_1_DRIVER_RANKING_FORM: Formula1DriverRankingFormValues = {
  rankingId: '',
  driverId: '',
  season: '',
  position: '',
  points: '',
  wins: '',
  behind: '',
  querySeason: '',
};

export function validateFormula1DriverRankingForm(
  values: Formula1DriverRankingFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') {
    if (parseRequiredInt(values.querySeason, 'Temporada') === 'invalid') {
      return 'Indica la temporada (año) para consultar.';
    }
    return null;
  }
  if (mode === 'delete' || mode === 'edit') {
    if (requireCanonicalId(values.rankingId, 'ID') === 'invalid') {
      return 'El ID del ranking (UUID del documento) es obligatorio.';
    }
    if (mode === 'delete') return null;
  }
  if (requireCanonicalId(values.driverId, 'Piloto') === 'invalid') {
    return 'Selecciona un piloto válido.';
  }
  if (parseRequiredInt(values.season, 'Temporada') === 'invalid') {
    return 'La temporada (año) es obligatoria.';
  }
  if (parseRequiredInt(values.position, 'Posición') === 'invalid') {
    return 'La posición es obligatoria.';
  }
  if (parseOptionalInt(values.points) === 'invalid') return 'Puntos debe ser un entero.';
  if (parseOptionalInt(values.wins) === 'invalid') return 'Victorias debe ser un entero.';
  if (parseOptionalInt(values.behind) === 'invalid') return 'Behind debe ser un entero.';
  return null;
}

export function buildFormula1DriverRankingBody(
  values: Formula1DriverRankingFormValues,
): Formula1DriverRankingCreate {
  const season = parseRequiredInt(values.season, 'Temporada');
  const position = parseRequiredInt(values.position, 'Posición');
  const points = parseOptionalInt(values.points);
  const wins = parseOptionalInt(values.wins);
  const behind = parseOptionalInt(values.behind);
  return {
    driverId: values.driverId.trim(),
    season: season === 'invalid' ? 0 : season,
    position: position === 'invalid' ? 0 : position,
    points: points === 'invalid' ? null : points,
    wins: wins === 'invalid' ? null : wins,
    behind: behind === 'invalid' ? null : behind,
  };
}

export interface Formula1TeamRankingFormValues {
  rankingId: string;
  teamId: string;
  season: string;
  position: string;
  points: string;
  querySeason: string;
}

export const EMPTY_FORMULA_1_TEAM_RANKING_FORM: Formula1TeamRankingFormValues = {
  rankingId: '',
  teamId: '',
  season: '',
  position: '',
  points: '',
  querySeason: '',
};

export function validateFormula1TeamRankingForm(
  values: Formula1TeamRankingFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') {
    if (parseRequiredInt(values.querySeason, 'Temporada') === 'invalid') {
      return 'Indica la temporada (año) para consultar.';
    }
    return null;
  }
  if (mode === 'delete' || mode === 'edit') {
    if (requireCanonicalId(values.rankingId, 'ID') === 'invalid') {
      return 'El ID del ranking (UUID del documento) es obligatorio.';
    }
    if (mode === 'delete') return null;
  }
  if (requireCanonicalId(values.teamId, 'Equipo') === 'invalid') {
    return 'Selecciona un equipo válido.';
  }
  if (parseRequiredInt(values.season, 'Temporada') === 'invalid') {
    return 'La temporada (año) es obligatoria.';
  }
  if (parseRequiredInt(values.position, 'Posición') === 'invalid') {
    return 'La posición es obligatoria.';
  }
  if (parseOptionalInt(values.points) === 'invalid') return 'Puntos debe ser un entero.';
  return null;
}

export function buildFormula1TeamRankingBody(
  values: Formula1TeamRankingFormValues,
): Formula1TeamRankingCreate {
  const season = parseRequiredInt(values.season, 'Temporada');
  const position = parseRequiredInt(values.position, 'Posición');
  const points = parseOptionalInt(values.points);
  return {
    teamId: values.teamId.trim(),
    season: season === 'invalid' ? 0 : season,
    position: position === 'invalid' ? 0 : position,
    points: points === 'invalid' ? null : points,
  };
}

export interface Formula1RaceRankingFormValues {
  rankingId: string;
  raceId: string;
  driverId: string;
  position: string;
  time: string;
  laps: string;
  grid: string;
  pits: string;
  gap: string;
  queryRaceId: string;
}

export const EMPTY_FORMULA_1_RACE_RANKING_FORM: Formula1RaceRankingFormValues = {
  rankingId: '',
  raceId: '',
  driverId: '',
  position: '',
  time: '',
  laps: '',
  grid: '',
  pits: '',
  gap: '',
  queryRaceId: '',
};

export function validateFormula1RaceRankingForm(
  values: Formula1RaceRankingFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') {
    if (requireCanonicalId(values.queryRaceId, 'Carrera') === 'invalid') {
      return 'Indica el UUID de la carrera para consultar resultados.';
    }
    return null;
  }
  if (mode === 'delete' || mode === 'edit') {
    if (requireCanonicalId(values.rankingId, 'ID') === 'invalid') {
      return 'El ID del ranking (UUID del documento) es obligatorio.';
    }
    if (mode === 'delete') return null;
  }
  if (requireCanonicalId(values.raceId, 'Carrera') === 'invalid') {
    return 'Selecciona una carrera válida.';
  }
  if (requireCanonicalId(values.driverId, 'Piloto') === 'invalid') {
    return 'Selecciona un piloto válido.';
  }
  if (parseRequiredInt(values.position, 'Posición') === 'invalid') {
    return 'La posición es obligatoria.';
  }
  if (parseOptionalInt(values.laps) === 'invalid') return 'Vueltas debe ser un entero.';
  if (parseOptionalInt(values.pits) === 'invalid') return 'Pits debe ser un entero.';
  return null;
}

export function buildFormula1RaceRankingBody(
  values: Formula1RaceRankingFormValues,
): Formula1RaceRankingCreate {
  const position = parseRequiredInt(values.position, 'Posición');
  const laps = parseOptionalInt(values.laps);
  const pits = parseOptionalInt(values.pits);
  return {
    raceId: values.raceId.trim(),
    driverId: values.driverId.trim(),
    position: position === 'invalid' ? 0 : position,
    time: nullableString(values.time),
    laps: laps === 'invalid' ? null : laps,
    grid: nullableString(values.grid),
    pits: pits === 'invalid' ? null : pits,
    gap: nullableString(values.gap),
  };
}
