import type { NflSeasonBody } from '../nfl-bff-types';
import { parseRequiredInt } from './shared';

export interface NflSeasonFormValues {
  year: string;
}

export const EMPTY_NFL_SEASON_FORM: NflSeasonFormValues = {
  year: String(new Date().getFullYear()),
};

export function validateNflSeasonForm(values: NflSeasonFormValues): string | null {
  const year = parseRequiredInt(values.year, 'año');
  if (year === 'invalid') return 'El año debe ser un entero válido.';
  if (year < 1900 || year > 2100) return 'El año debe estar entre 1900 y 2100.';
  return null;
}

export function buildNflSeasonBody(values: NflSeasonFormValues): NflSeasonBody {
  return { year: Number(values.year.trim()) };
}
