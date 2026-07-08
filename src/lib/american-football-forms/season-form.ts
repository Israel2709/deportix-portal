import type { AmericanFootballSeasonBody } from '../american-football-bff-types';
import { parseRequiredInt } from './shared';

export interface AmericanFootballSeasonFormValues {
  queryLeague: string;
  year: string;
}

export const EMPTY_AMERICAN_FOOTBALL_SEASON_FORM: AmericanFootballSeasonFormValues = {
  queryLeague: '',
  year: String(new Date().getFullYear()),
};

export function validateAmericanFootballSeasonForm(values: AmericanFootballSeasonFormValues): string | null {
  if (!values.queryLeague.trim()) return 'Selecciona una liga.';
  const year = parseRequiredInt(values.year, 'año');
  if (year === 'invalid') return 'El año debe ser un entero válido.';
  if (year < 1900 || year > 2100) return 'El año debe estar entre 1900 y 2100.';
  return null;
}

export function buildAmericanFootballSeasonBody(values: AmericanFootballSeasonFormValues): AmericanFootballSeasonBody {
  return { year: Number(values.year.trim()) };
}
