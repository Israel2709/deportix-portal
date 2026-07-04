import type { AmericanFootballTeamItem } from '../american-football-bff-types';
import { nullableString, parseRequiredInt } from './shared';

export interface AmericanFootballTeamFormValues {
  queryLeague: string;
  querySeason: string;
  teamId: string;
  deleteId: string;
  id: string;
  name: string;
  logo: string;
  altLogo: string;
}

export const EMPTY_AMERICAN_FOOTBALL_TEAM_FORM: AmericanFootballTeamFormValues = {
  queryLeague: '1',
  querySeason: '2022',
  teamId: '',
  deleteId: '',
  id: '25',
  name: 'Miami Dolphins',
  logo: 'https://media.api-sports.io/american-football/teams/25.png',
  altLogo: '',
};

export function teamToFormValues(item: AmericanFootballTeamItem): AmericanFootballTeamFormValues {
  return {
    ...EMPTY_AMERICAN_FOOTBALL_TEAM_FORM,
    teamId: String(item.id),
    deleteId: String(item.id),
    id: String(item.id),
    name: item.name,
    logo: item.logo ?? '',
    altLogo: item.altLogo ?? '',
  };
}

export function validateAmericanFootballTeamForm(values: AmericanFootballTeamFormValues, mode: 'create' | 'edit' | 'delete' | 'query'): string | null {
  if (mode === 'query') {
    if (!values.queryLeague.trim()) return 'La liga es obligatoria para consultar.';
    if (!values.querySeason.trim()) return 'La temporada es obligatoria para consultar.';
    return null;
  }
  if (mode === 'delete') {
    if (!values.deleteId.trim()) return 'El ID del equipo es obligatorio para eliminar.';
    return null;
  }
  const id = parseRequiredInt(values.id, 'ID');
  if (id === 'invalid') return 'El ID del equipo debe ser un entero válido.';
  if (!values.name.trim()) return 'El nombre es obligatorio.';
  if (mode === 'edit' && !values.teamId.trim()) return 'El ID del equipo es obligatorio para editar.';
  return null;
}

export function buildAmericanFootballTeamBody(values: AmericanFootballTeamFormValues): AmericanFootballTeamItem {
  const id = values.id.trim();
  return {
    id: /^\d+$/.test(id) ? Number(id) : id,
    name: values.name.trim(),
    logo: nullableString(values.logo),
    altLogo: nullableString(values.altLogo),
  };
}
