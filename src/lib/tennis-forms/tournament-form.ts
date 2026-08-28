import type { TennisTournamentCreate, TennisTournamentItem } from '../tennis-bff-types';
import { nullableString, parseRequiredInt, requireCanonicalId } from './shared';

export interface TennisTournamentFormValues {
  id: string;
  name: string;
  shortName: string;
  category: string;
  gender: string;
  countryCode: string;
  city: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  year: string;
  status: string;
}

export const EMPTY_TENNIS_TOURNAMENT_FORM: TennisTournamentFormValues = {
  id: '',
  name: '',
  shortName: '',
  category: 'grand_slam',
  gender: 'male',
  countryCode: '',
  city: '',
  imageUrl: '',
  startDate: '',
  endDate: '',
  year: String(new Date().getFullYear()),
  status: 'upcoming',
};

export const TENNIS_CATEGORY_OPTIONS = [
  { value: 'grand_slam', label: 'Grand Slam' },
  { value: 'atp_1000', label: 'ATP 1000' },
  { value: 'wta_1000', label: 'WTA 1000' },
];

export const TENNIS_GENDER_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
];

export const TENNIS_TOURNAMENT_STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Próximo' },
  { value: 'active', label: 'En curso' },
  { value: 'finished', label: 'Finalizado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export function tournamentToFormValues(item: TennisTournamentItem): TennisTournamentFormValues {
  return {
    id: item.id,
    name: item.name,
    shortName: item.shortName ?? '',
    category: item.category,
    gender: item.gender,
    countryCode: item.country.code,
    city: item.city ?? '',
    imageUrl: item.imageUrl ?? '',
    startDate: item.startDate,
    endDate: item.endDate,
    year: String(item.year),
    status: item.status,
  };
}

export function validateTennisTournamentForm(
  values: TennisTournamentFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') return null;
  if (mode === 'delete') {
    if (requireCanonicalId(values.id, 'ID') === 'invalid') {
      return 'Selecciona un torneo de la lista para eliminar.';
    }
    return null;
  }
  if (!values.name.trim()) return 'El nombre del torneo es obligatorio.';
  if (!values.category.trim()) return 'La categoría es obligatoria.';
  if (!values.gender.trim()) return 'El género es obligatorio.';
  if (!values.countryCode.trim()) return 'El código de país es obligatorio.';
  if (!values.startDate.trim()) return 'La fecha de inicio es obligatoria.';
  if (!values.endDate.trim()) return 'La fecha de fin es obligatoria.';
  if (parseRequiredInt(values.year, 'Año') === 'invalid') return 'El año es obligatorio.';
  if (mode === 'edit' && requireCanonicalId(values.id, 'ID') === 'invalid') {
    return 'Selecciona un torneo de la lista para editar.';
  }
  return null;
}

export function buildTennisTournamentBody(values: TennisTournamentFormValues): TennisTournamentCreate {
  const year = parseRequiredInt(values.year, 'Año');
  return {
    name: values.name.trim(),
    shortName: nullableString(values.shortName),
    category: values.category as TennisTournamentCreate['category'],
    gender: values.gender as TennisTournamentCreate['gender'],
    eventType: 'singles',
    countryCode: values.countryCode.trim().toUpperCase(),
    city: nullableString(values.city),
    imageUrl: nullableString(values.imageUrl),
    startDate: values.startDate.trim(),
    endDate: values.endDate.trim(),
    year: year === 'invalid' ? new Date().getFullYear() : year,
    status: values.status as TennisTournamentCreate['status'],
  };
}
