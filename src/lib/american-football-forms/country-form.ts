import type { AmericanFootballCountryItem } from '../american-football-bff-types';
import { nullableString } from './shared';

export interface AmericanFootballCountryFormValues {
  name: string;
  code: string;
  flag: string;
  filterName: string;
}

export const EMPTY_AMERICAN_FOOTBALL_COUNTRY_FORM: AmericanFootballCountryFormValues = {
  name: 'USA',
  code: 'US',
  flag: 'https://media.api-sports.io/flags/us.svg',
  filterName: '',
};

export function countryToFormValues(item: AmericanFootballCountryItem): AmericanFootballCountryFormValues {
  return {
    name: item.name,
    code: item.code ?? '',
    flag: item.flag ?? '',
    filterName: '',
  };
}

export function validateAmericanFootballCountryForm(values: AmericanFootballCountryFormValues, mode: 'create' | 'edit' | 'delete'): string | null {
  if (mode === 'delete') {
    if (!values.name.trim()) return 'El nombre del país es obligatorio para eliminar.';
    return null;
  }
  if (!values.name.trim()) return 'El nombre es obligatorio.';
  return null;
}

export function buildAmericanFootballCountryBody(values: AmericanFootballCountryFormValues): AmericanFootballCountryItem {
  return {
    name: values.name.trim(),
    code: nullableString(values.code),
    flag: nullableString(values.flag),
  };
}
