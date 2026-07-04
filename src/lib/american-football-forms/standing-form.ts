import type { AmericanFootballStandingItem, AmericanFootballTeamItem } from '../american-football-bff-types';
import { nullableString, parseOptionalInt, parseRequiredInt } from './shared';

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
  queryLeague: '1',
  querySeason: '2022',
  queryConference: '',
  standingId: '',
  deleteId: '',
  leagueId: '1',
  leagueName: 'NFL',
  leagueSeason: '2022',
  leagueLogo: 'https://media.api-sports.io/american-football/leagues/1.png',
  leagueCountryName: 'USA',
  leagueCountryCode: 'US',
  leagueCountryFlag: 'https://media.api-sports.io/flags/us.svg',
  conference: 'American Football Conference',
  division: 'East',
  position: '1',
  teamId: '25',
  teamName: 'Miami Dolphins',
  teamLogo: 'https://media.api-sports.io/american-football/teams/25.png',
  won: '3',
  lost: '1',
  ties: '0',
  pointsFor: '98',
  pointsAgainst: '91',
  pointsDifference: '7',
  recordHome: '2-0',
  recordRoad: '1-1',
  recordConference: '3-1',
  recordDivision: '2-0',
  streak: 'L1',
};

export function standingToFormValues(item: AmericanFootballStandingItem): AmericanFootballStandingFormValues {
  return {
    ...EMPTY_AMERICAN_FOOTBALL_STANDING_FORM,
    standingId: String(item.team.id),
    deleteId: String(item.team.id),
    leagueId: String(item.league.id),
    leagueName: item.league.name,
    leagueSeason: item.league.season != null ? String(item.league.season) : '',
    leagueLogo: item.league.logo ?? '',
    leagueCountryName: item.league.country?.name ?? 'USA',
    leagueCountryCode: item.league.country?.code ?? '',
    leagueCountryFlag: item.league.country?.flag ?? '',
    conference: item.conference ?? '',
    division: item.division ?? '',
    position: item.position != null ? String(item.position) : '',
    teamId: String(item.team.id),
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
    teamId: String(team.id),
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
    if (!values.deleteId.trim()) return 'El ID de la fila es obligatorio para eliminar.';
    return null;
  }
  if (!values.teamName.trim()) return 'El equipo es obligatorio.';
  const teamId = parseRequiredInt(values.teamId, 'ID de equipo');
  if (teamId === 'invalid') return 'El ID del equipo debe ser un entero válido.';
  for (const [label, field] of [
    ['Victorias', values.won],
    ['Derrotas', values.lost],
    ['Empates', values.ties],
    ['Posición', values.position],
  ] as const) {
    const parsed = parseOptionalInt(field);
    if (parsed === 'invalid') return `${label}: entero inválido.`;
  }
  if (mode === 'edit' && !values.standingId.trim()) {
    return 'El ID de la fila es obligatorio para editar.';
  }
  return null;
}

function parseId(value: string): number | string {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
}

function toOptionalInt(value: string): number | null {
  const parsed = parseOptionalInt(value);
  return parsed === 'invalid' ? null : parsed;
}

export function buildAmericanFootballStandingBody(values: AmericanFootballStandingFormValues): AmericanFootballStandingItem {
  return {
    league: {
      id: parseId(values.leagueId),
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
      id: parseId(values.teamId),
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
