import type { Formula1CircuitCreate, Formula1CircuitItem } from '../formula-1-bff-types';
import { nullableString, requireCanonicalId } from './shared';

export interface Formula1CircuitFormValues {
  id: string;
  name: string;
  image: string;
  country: string;
}

export const EMPTY_FORMULA_1_CIRCUIT_FORM: Formula1CircuitFormValues = {
  id: '',
  name: '',
  image: '',
  country: '',
};

export function circuitToFormValues(item: Formula1CircuitItem): Formula1CircuitFormValues {
  return {
    id: item.id,
    name: item.name,
    image: item.image ?? '',
    country: item.country ?? '',
  };
}

export function validateFormula1CircuitForm(
  values: Formula1CircuitFormValues,
  mode: 'create' | 'edit' | 'delete',
): string | null {
  if (mode === 'delete') {
    if (requireCanonicalId(values.id, 'ID') === 'invalid') {
      return 'Selecciona un circuito de la lista para eliminar.';
    }
    return null;
  }
  if (!values.name.trim()) return 'El nombre es obligatorio.';
  if (mode === 'edit' && requireCanonicalId(values.id, 'ID') === 'invalid') {
    return 'Selecciona un circuito de la lista para editar.';
  }
  return null;
}

export function buildFormula1CircuitBody(values: Formula1CircuitFormValues): Formula1CircuitCreate {
  return {
    name: values.name.trim(),
    image: nullableString(values.image),
    country: nullableString(values.country),
  };
}
