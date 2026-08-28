import type { TennisPlayerCreate, TennisPlayerItem } from '../tennis-bff-types';
import { nullableString, requireCanonicalId } from './shared';

export interface TennisPlayerFormValues {
  id: string;
  fullName: string;
  displayName: string;
  photoUrl: string;
  countryCode: string;
  published: string;
}

export const EMPTY_TENNIS_PLAYER_FORM: TennisPlayerFormValues = {
  id: '',
  fullName: '',
  displayName: '',
  photoUrl: '',
  countryCode: '',
  published: 'false',
};

export function playerToFormValues(item: TennisPlayerItem): TennisPlayerFormValues {
  return {
    id: item.id,
    fullName: item.fullName,
    displayName: item.displayName,
    photoUrl: item.photoUrl ?? '',
    countryCode: item.country.code,
    published: item.published ? 'true' : 'false',
  };
}

export function validateTennisPlayerForm(
  values: TennisPlayerFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') return null;
  if (mode === 'delete') {
    if (requireCanonicalId(values.id, 'ID') === 'invalid') {
      return 'Selecciona un jugador de la lista para eliminar.';
    }
    return null;
  }
  if (!values.fullName.trim()) return 'El nombre completo es obligatorio.';
  if (!values.displayName.trim()) return 'El nombre visible es obligatorio.';
  if (!values.countryCode.trim()) return 'El código de país (ISO) es obligatorio.';
  if (mode === 'edit' && requireCanonicalId(values.id, 'ID') === 'invalid') {
    return 'Selecciona un jugador de la lista para editar.';
  }
  return null;
}

export function buildTennisPlayerBody(values: TennisPlayerFormValues): TennisPlayerCreate {
  return {
    fullName: values.fullName.trim(),
    displayName: values.displayName.trim(),
    photoUrl: nullableString(values.photoUrl),
    countryCode: values.countryCode.trim().toUpperCase(),
    published: values.published === 'true',
  };
}
