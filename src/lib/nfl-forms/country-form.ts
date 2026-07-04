import type { NflCountryItem } from '../nfl-bff-types';
import { nullableString } from './shared';

export interface NflCountryFormValues {
  name: string;
  code: string;
  flag: string;
  filterName: string;
}

export const EMPTY_NFL_COUNTRY_FORM: NflCountryFormValues = {
  name: 'USA',
  code: 'US',
  flag: 'https://media.api-sports.io/flags/us.svg',
  filterName: '',
};

export function countryToFormValues(item: NflCountryItem): NflCountryFormValues {
  return {
    name: item.name,
    code: item.code ?? '',
    flag: item.flag ?? '',
    filterName: '',
  };
}

export function validateNflCountryForm(values: NflCountryFormValues, mode: 'create' | 'edit' | 'delete'): string | null {
  if (mode === 'delete') {
    if (!values.name.trim()) return 'El nombre del país es obligatorio para eliminar.';
    return null;
  }
  if (!values.name.trim()) return 'El nombre es obligatorio.';
  return null;
}

export function buildNflCountryBody(values: NflCountryFormValues): NflCountryItem {
  return {
    name: values.name.trim(),
    code: nullableString(values.code),
    flag: nullableString(values.flag),
  };
}
