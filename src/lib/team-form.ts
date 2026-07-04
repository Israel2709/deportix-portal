import type { Team } from './types';
import type { TeamEditPatch, VenueEditPatch } from './team-edits';

export interface TeamFormValues {
  name: string;
  code: string;
  country: string;
  logo: string;
  altName: string;
  altLogo: string;
  city: string;
  conference: string;
  division: string;
  venueName: string;
  venueCity: string;
  venueCapacity: string;
}

export type TeamFormField = keyof TeamFormValues;

const COMMON_FIELDS: TeamFormField[] = ['name', 'altName', 'logo', 'altLogo'];
const SOCCER_FIELDS: TeamFormField[] = ['code', 'country', 'venueName', 'venueCity', 'venueCapacity'];
const AMERICAN_FOOTBALL_FIELDS: TeamFormField[] = ['code', 'city', 'conference', 'division'];
const GENERIC_FIELDS: TeamFormField[] = ['code'];

export const TEAM_FORM_FIELD_LABELS: Record<TeamFormField, string> = {
  name: 'Nombre',
  code: 'Código',
  country: 'País',
  logo: 'Logo',
  altName: 'Nombre alternativo',
  altLogo: 'Logo alternativo (alt_logo)',
  city: 'Ciudad',
  conference: 'Conferencia',
  division: 'División',
  venueName: 'Estadio',
  venueCity: 'Ciudad del estadio',
  venueCapacity: 'Capacidad del estadio',
};

export function teamFormFieldsForSport(sport: string | null): TeamFormField[] {
  if (sport === 'soccer') return [...COMMON_FIELDS, ...SOCCER_FIELDS];
  if (sport === 'american-football') return [...COMMON_FIELDS, ...AMERICAN_FOOTBALL_FIELDS];
  return [...COMMON_FIELDS, ...GENERIC_FIELDS];
}

function nullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalCapacity(value: string): number | null | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) return 'invalid';
  return parsed;
}

export function teamToFormValues(team: Team): TeamFormValues {
  return {
    name: team.name ?? '',
    code: team.code ?? '',
    country: team.country ?? '',
    logo: team.logo ?? '',
    altName: team.altName ?? '',
    altLogo: team.altLogo ?? '',
    city: team.city ?? '',
    conference: team.conference ?? '',
    division: team.division ?? '',
    venueName: team.venue?.name ?? '',
    venueCity: team.venue?.city ?? '',
    venueCapacity: team.venue?.capacity != null ? String(team.venue.capacity) : '',
  };
}

export function validateTeamForm(values: TeamFormValues, sport: string | null): string | null {
  if (!values.name.trim()) return 'El nombre es obligatorio.';

  const capacity = parseOptionalCapacity(values.venueCapacity);
  if (capacity === 'invalid') {
    return 'La capacidad del estadio debe ser un entero mayor o igual a 0.';
  }

  if (sport === 'american-football') {
    if (!values.city.trim()) return 'La ciudad es obligatoria para equipos NFL.';
    if (!values.conference.trim()) return 'La conferencia es obligatoria para equipos NFL.';
    if (!values.division.trim()) return 'La división es obligatoria para equipos NFL.';
  }

  return null;
}

function buildVenuePatch(values: TeamFormValues, sport: string | null): VenueEditPatch | null | undefined {
  if (sport !== 'soccer') return undefined;

  const capacity = parseOptionalCapacity(values.venueCapacity);
  return {
    name: nullableString(values.venueName),
    city: nullableString(values.venueCity),
    capacity: capacity === 'invalid' ? null : capacity,
  };
}

export function formValuesToPatch(values: TeamFormValues, sport: string | null): TeamEditPatch {
  const patch: TeamEditPatch = {
    name: nullableString(values.name),
    code: nullableString(values.code),
    logo: nullableString(values.logo),
    altName: nullableString(values.altName),
    altLogo: nullableString(values.altLogo),
  };

  if (sport === 'soccer') {
    patch.country = nullableString(values.country);
    patch.venue = buildVenuePatch(values, sport) ?? null;
  } else if (sport === 'american-football') {
    patch.city = nullableString(values.city);
    patch.conference = nullableString(values.conference);
    patch.division = nullableString(values.division);
  }

  return patch;
}

export function editTeamFormPath(leagueId: string, teamId: string): string {
  return `/leagues/${encodeURIComponent(leagueId)}/equipos/${encodeURIComponent(teamId)}/editar`;
}
