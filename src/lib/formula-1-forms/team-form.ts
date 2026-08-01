import type { Formula1TeamCreate, Formula1TeamItem } from '../formula-1-bff-types';
import { nullableString, requireCanonicalId } from './shared';

export interface Formula1TeamFormValues {
  id: string;
  name: string;
  logo: string;
}

export const EMPTY_FORMULA_1_TEAM_FORM: Formula1TeamFormValues = {
  id: '',
  name: '',
  logo: '',
};

export function teamToFormValues(item: Formula1TeamItem): Formula1TeamFormValues {
  return {
    id: item.id,
    name: item.name,
    logo: item.logo ?? '',
  };
}

export function validateFormula1TeamForm(
  values: Formula1TeamFormValues,
  mode: 'create' | 'edit' | 'delete',
): string | null {
  if (mode === 'delete') {
    if (requireCanonicalId(values.id, 'ID') === 'invalid') {
      return 'Selecciona un equipo de la lista para eliminar.';
    }
    return null;
  }
  if (!values.name.trim()) return 'El nombre es obligatorio.';
  if (mode === 'edit' && requireCanonicalId(values.id, 'ID') === 'invalid') {
    return 'Selecciona un equipo de la lista para editar.';
  }
  return null;
}

export function buildFormula1TeamBody(values: Formula1TeamFormValues): Formula1TeamCreate {
  return {
    name: values.name.trim(),
    logo: nullableString(values.logo),
  };
}
