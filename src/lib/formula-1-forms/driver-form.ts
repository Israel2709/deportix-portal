import type { Formula1DriverCreate, Formula1DriverItem } from '../formula-1-bff-types';
import { isCanonicalId, parseOptionalInt, requireCanonicalId } from './shared';

export interface Formula1DriverFormValues {
  id: string;
  name: string;
  number: string;
  teamId: string;
}

export const EMPTY_FORMULA_1_DRIVER_FORM: Formula1DriverFormValues = {
  id: '',
  name: '',
  number: '',
  teamId: '',
};

export function driverToFormValues(item: Formula1DriverItem): Formula1DriverFormValues {
  return {
    id: item.id,
    name: item.name,
    number: item.number != null ? String(item.number) : '',
    teamId: item.team?.id ?? '',
  };
}

export function validateFormula1DriverForm(
  values: Formula1DriverFormValues,
  mode: 'create' | 'edit' | 'delete',
): string | null {
  if (mode === 'delete') {
    if (requireCanonicalId(values.id, 'ID') === 'invalid') {
      return 'Selecciona un piloto de la lista para eliminar.';
    }
    return null;
  }
  if (!values.name.trim()) return 'El nombre es obligatorio.';
  if (parseOptionalInt(values.number) === 'invalid') return 'El número debe ser un entero.';
  if (values.teamId.trim() && !isCanonicalId(values.teamId)) {
    return 'El equipo debe ser un UUID canónico.';
  }
  if (mode === 'edit' && requireCanonicalId(values.id, 'ID') === 'invalid') {
    return 'Selecciona un piloto de la lista para editar.';
  }
  return null;
}

export function buildFormula1DriverBody(values: Formula1DriverFormValues): Formula1DriverCreate {
  const number = parseOptionalInt(values.number);
  return {
    name: values.name.trim(),
    number: number === 'invalid' ? null : number,
    teamId: values.teamId.trim() ? values.teamId.trim() : null,
  };
}
