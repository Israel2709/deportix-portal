import type { AmericanFootballStandingCreate, AmericanFootballStandingItem, AmericanFootballTeamItem } from '../american-football-bff-types';
import { nullableString, parseOptionalInt, requireCanonicalId } from './shared';

export interface AmericanFootballStandingFormValues {
  queryLeague: string;
  querySeason: string;
  queryConference: string;
  standingId: string;
  deleteId: string;
  leagueId: string;
  leagueName: string;
  leagueSeason: string;
  leagueLogo: string;
  leagueCountryName: string;
  leagueCountryCode: string;
  leagueCountryFlag: string;
  conference: string;
  division: string;
  position: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  won: string;
  lost: string;
  ties: string;
  pointsFor: string;
  pointsAgainst: string;
  pointsDifference: string;
  recordHome: string;
  recordRoad: string;
  recordConference: string;
  recordDivision: string;
  streak: string;
}

export const EMPTY_AMERICAN_FOOTBALL_STANDING_FORM: AmericanFootballStandingFormValues = {
  queryLeague: '',
  querySeason: '2022',
  queryConference: '',
  standingId: '',
  deleteId: '',
  leagueId: '',
  leagueName: '',
  leagueSeason: '2022',
  leagueLogo: '',
  leagueCountryName: 'USA',
  leagueCountryCode: 'US',
  leagueCountryFlag: '',
  conference: '',
  division: '',
  position: '',
  teamId: '',
  teamName: '',
  teamLogo: '',
  won: '',
  lost: '',
  ties: '',
  pointsFor: '',
  pointsAgainst: '',
  pointsDifference: '',
  recordHome: '',
  recordRoad: '',
  recordConference: '',
  recordDivision: '',
  streak: '',
};

export function standingToFormValues(item: AmericanFootballStandingItem): AmericanFootballStandingFormValues {
  return {
    ...EMPTY_AMERICAN_FOOTBALL_STANDING_FORM,
    standingId: item.id,
    deleteId: item.id,
    leagueId: item.league.id,
    leagueName: item.league.name,
    leagueSeason: item.league.season != null ? String(item.league.season) : '',
    leagueLogo: item.league.logo ?? '',
    leagueCountryName: item.league.country?.name ?? 'USA',
    leagueCountryCode: item.league.country?.code ?? '',
    leagueCountryFlag: item.league.country?.flag ?? '',
    conference: item.conference ?? '',
    division: item.division ?? '',
    position: item.position != null ? String(item.position) : '',
    teamId: item.team.id,
    teamName: item.team.name,
    teamLogo: item.team.logo ?? '',
    won: item.won != null ? String(item.won) : '',
    lost: item.lost != null ? String(item.lost) : '',
    ties: item.ties != null ? String(item.ties) : '',
    pointsFor: item.points?.for != null ? String(item.points.for) : '',
    pointsAgainst: item.points?.against != null ? String(item.points.against) : '',
    pointsDifference: item.points?.difference != null ? String(item.points.difference) : '',
    recordHome: item.records?.home ?? '',
    recordRoad: item.records?.road ?? '',
    recordConference: item.records?.conference ?? '',
    recordDivision: item.records?.division ?? '',
    streak: item.streak ?? '',
  };
}

export function applyTeamToStanding(
  values: AmericanFootballStandingFormValues,
  team: AmericanFootballTeamItem,
): AmericanFootballStandingFormValues {
  return {
    ...values,
    teamId: team.id,
    teamName: team.name,
    teamLogo: team.logo ?? '',
  };
}

export function validateAmericanFootballStandingForm(
  values: AmericanFootballStandingFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') {
    if (!values.queryLeague.trim()) return 'La liga es obligatoria para consultar.';
    if (!values.querySeason.trim()) return 'La temporada es obligatoria para consultar.';
    return null;
  }
  if (mode === 'delete') {
    if (requireCanonicalId(values.deleteId, 'ID') === 'invalid') {
      return 'Selecciona una fila de la lista para eliminar.';
    }
    return null;
  }
  if (!values.teamName.trim()) return 'Selecciona un equipo.';
  if (requireCanonicalId(values.teamId, 'Equipo') === 'invalid') {
    return 'El equipo debe seleccionarse de la lista (UUID).';
  }
  if (requireCanonicalId(values.leagueId || values.queryLeague, 'Liga') === 'invalid') {
    return 'Indica el UUID de la liga (query o embebida).';
  }
  for (const [label, field] of [
    ['Victorias', values.won],
    ['Derrotas', values.lost],
    ['Empates', values.ties],
    ['Posición', values.position],
  ] as const) {
    const parsed = parseOptionalInt(field);
    if (parsed === 'invalid') return `${label}: entero inválido.`;
  }
  if (mode === 'edit' && requireCanonicalId(values.standingId, 'ID') === 'invalid') {
    return 'Selecciona una fila de la lista para editar.';
  }
  return null;
}

function toOptionalInt(value: string): number | null {
  const parsed = parseOptionalInt(value);
  return parsed === 'invalid' ? null : parsed;
}

export function buildAmericanFootballStandingBody(
  values: AmericanFootballStandingFormValues,
): AmericanFootballStandingCreate {
  return {
    league: {
      id: (values.leagueId || values.queryLeague).trim(),
      name: values.leagueName.trim(),
      season: values.leagueSeason.trim() ? values.leagueSeason.trim() : undefined,
      logo: nullableString(values.leagueLogo),
      country: {
        name: values.leagueCountryName.trim(),
        code: nullableString(values.leagueCountryCode),
        flag: nullableString(values.leagueCountryFlag),
      },
    },
    conference: nullableString(values.conference),
    division: nullableString(values.division),
    position: toOptionalInt(values.position),
    team: {
      id: values.teamId.trim(),
      name: values.teamName.trim(),
      logo: nullableString(values.teamLogo),
    },
    won: toOptionalInt(values.won),
    lost: toOptionalInt(values.lost),
    ties: toOptionalInt(values.ties),
    points: {
      for: toOptionalInt(values.pointsFor),
      against: toOptionalInt(values.pointsAgainst),
      difference: toOptionalInt(values.pointsDifference),
    },
    records: {
      home: nullableString(values.recordHome),
      road: nullableString(values.recordRoad),
      conference: nullableString(values.recordConference),
      division: nullableString(values.recordDivision),
    },
    streak: nullableString(values.streak),
    ncaa_conference: {
      won: null,
      lost: null,
      points: { for: null, against: null },
    },
  };
}
