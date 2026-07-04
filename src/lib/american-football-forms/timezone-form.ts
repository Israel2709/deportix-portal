import type { AmericanFootballTimezonePatchBody, AmericanFootballTimezonePostBody } from '../american-football-bff-types';

export interface AmericanFootballTimezoneFormValues {
  timezone: string;
  newTimezone: string;
}

export const EMPTY_AMERICAN_FOOTBALL_TIMEZONE_FORM: AmericanFootballTimezoneFormValues = {
  timezone: 'America/New_York',
  newTimezone: '',
};

export function validateAmericanFootballTimezoneForm(
  values: AmericanFootballTimezoneFormValues,
  mode: 'create' | 'edit' | 'delete',
): string | null {
  if (!values.timezone.trim()) return 'La zona horaria es obligatoria.';
  if (mode === 'edit' && !values.newTimezone.trim()) {
    return 'La nueva zona horaria es obligatoria para renombrar.';
  }
  return null;
}

export function buildAmericanFootballTimezonePostBody(values: AmericanFootballTimezoneFormValues): AmericanFootballTimezonePostBody {
  return { timezone: values.timezone.trim() };
}

export function buildAmericanFootballTimezonePatchBody(values: AmericanFootballTimezoneFormValues): AmericanFootballTimezonePatchBody {
  return {
    timezone: values.timezone.trim(),
    newTimezone: values.newTimezone.trim(),
  };
}
