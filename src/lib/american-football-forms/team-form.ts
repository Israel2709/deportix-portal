import type { AmericanFootballTeamCreate, AmericanFootballTeamItem } from '../american-football-bff-types';
import { nullableString, requireCanonicalId } from './shared';

export interface AmericanFootballTeamFormValues {
  queryLeague: string;
  querySeason: string;
  teamId: string;
  deleteId: string;
  name: string;
  logo: string;
  altLogo: string;
}

export const EMPTY_AMERICAN_FOOTBALL_TEAM_FORM: AmericanFootballTeamFormValues = {
  queryLeague: '',
  querySeason: '',
  teamId: '',
  deleteId: '',
  name: '',
  logo: '',
  altLogo: '',
};

export function teamToFormValues(item: AmericanFootballTeamItem): AmericanFootballTeamFormValues {
  return {
    ...EMPTY_AMERICAN_FOOTBALL_TEAM_FORM,
    teamId: item.id,
    deleteId: item.id,
    name: item.name,
    logo: item.logo ?? '',
    altLogo: item.altLogo ?? '',
  };
}

export function validateAmericanFootballTeamForm(
  values: AmericanFootballTeamFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query' || mode === 'create') {
    if (!values.queryLeague.trim()) return 'Selecciona una liga.';
    if (!values.querySeason.trim()) return 'Selecciona una temporada.';
  }
  if (mode === 'query') {
    return null;
  }
  if (mode === 'delete') {
    if (requireCanonicalId(values.deleteId, 'ID') === 'invalid') {
      return 'Selecciona un equipo de la lista para eliminar.';
    }
    return null;
  }
  if (!values.name.trim()) return 'El nombre es obligatorio.';
  if (mode === 'edit' && requireCanonicalId(values.teamId, 'ID') === 'invalid') {
    return 'Selecciona un equipo de la lista para editar.';
  }
  return null;
}

export function buildAmericanFootballTeamBody(values: AmericanFootballTeamFormValues): AmericanFootballTeamCreate {
  return {
    name: values.name.trim(),
    logo: nullableString(values.logo),
    altLogo: nullableString(values.altLogo),
  };
}
