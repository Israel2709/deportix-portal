import type { Formula1CompetitionCreate, Formula1CompetitionItem } from '../formula-1-bff-types';
import { requireCanonicalId } from './shared';

export interface Formula1CompetitionFormValues {
  id: string;
  name: string;
}

export const EMPTY_FORMULA_1_COMPETITION_FORM: Formula1CompetitionFormValues = {
  id: '',
  name: '',
};

export function competitionToFormValues(item: Formula1CompetitionItem): Formula1CompetitionFormValues {
  return { id: item.id, name: item.name };
}

export function validateFormula1CompetitionForm(
  values: Formula1CompetitionFormValues,
  mode: 'create' | 'edit' | 'delete',
): string | null {
  if (mode === 'delete') {
    if (requireCanonicalId(values.id, 'ID') === 'invalid') {
      return 'Selecciona una competición de la lista para eliminar.';
    }
    return null;
  }
  if (!values.name.trim()) return 'El nombre es obligatorio.';
  if (mode === 'edit' && requireCanonicalId(values.id, 'ID') === 'invalid') {
    return 'Selecciona una competición de la lista para editar.';
  }
  return null;
}

export function buildFormula1CompetitionBody(
  values: Formula1CompetitionFormValues,
): Formula1CompetitionCreate {
  return { name: values.name.trim() };
}
