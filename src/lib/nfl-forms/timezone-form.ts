import type { NflTimezonePatchBody, NflTimezonePostBody } from '../nfl-bff-types';

export interface NflTimezoneFormValues {
  timezone: string;
  newTimezone: string;
}

export const EMPTY_NFL_TIMEZONE_FORM: NflTimezoneFormValues = {
  timezone: 'America/New_York',
  newTimezone: '',
};

export function validateNflTimezoneForm(
  values: NflTimezoneFormValues,
  mode: 'create' | 'edit' | 'delete',
): string | null {
  if (!values.timezone.trim()) return 'La zona horaria es obligatoria.';
  if (mode === 'edit' && !values.newTimezone.trim()) {
    return 'La nueva zona horaria es obligatoria para renombrar.';
  }
  return null;
}

export function buildNflTimezonePostBody(values: NflTimezoneFormValues): NflTimezonePostBody {
  return { timezone: values.timezone.trim() };
}

export function buildNflTimezonePatchBody(values: NflTimezoneFormValues): NflTimezonePatchBody {
  return {
    timezone: values.timezone.trim(),
    newTimezone: values.newTimezone.trim(),
  };
}
