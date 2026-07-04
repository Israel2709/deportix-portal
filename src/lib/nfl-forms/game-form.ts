import type { NflGameItem, NflGameScoreSide, NflTeamItem } from '../nfl-bff-types';
import { nullableString, parseOptionalInt, parseOptionalNumber, parseRequiredInt } from './shared';

export interface NflGameFormValues {
  queryLeague: string;
  querySeason: string;
  queryTimezone: string;
  queryTeam: string;
  queryGameId: string;
  gameId: string;
  replaceOnPatch: boolean;
  stage: string;
  week: string;
  dateTimezone: string;
  dateDate: string;
  dateTime: string;
  dateTimestamp: string;
  venueName: string;
  venueCity: string;
  statusShort: string;
  statusLong: string;
  leagueId: string;
  leagueName: string;
  leagueSeason: string;
  leagueLogo: string;
  leagueCountryName: string;
  leagueCountryCode: string;
  leagueCountryFlag: string;
  homeId: string;
  homeName: string;
  homeLogo: string;
  awayId: string;
  awayName: string;
  awayLogo: string;
  homeQ1: string;
  homeQ2: string;
  homeQ3: string;
  homeQ4: string;
  homeOt: string;
  homeTotal: string;
  awayQ1: string;
  awayQ2: string;
  awayQ3: string;
  awayQ4: string;
  awayOt: string;
  awayTotal: string;
}

export const EMPTY_NFL_GAME_FORM: NflGameFormValues = {
  queryLeague: '1',
  querySeason: '2022',
  queryTimezone: 'UTC',
  queryTeam: '',
  queryGameId: '',
  gameId: '4550',
  replaceOnPatch: false,
  stage: 'Regular Season',
  week: '5',
  dateTimezone: 'UTC',
  dateDate: '2022-09-30',
  dateTime: '00:00',
  dateTimestamp: '1664496000',
  venueName: 'Hard Rock Stadium',
  venueCity: 'Miami Gardens',
  statusShort: 'FT',
  statusLong: 'Finished',
  leagueId: '1',
  leagueName: 'NFL',
  leagueSeason: '2022',
  leagueLogo: 'https://media.api-sports.io/american-football/leagues/1.png',
  leagueCountryName: 'USA',
  leagueCountryCode: 'US',
  leagueCountryFlag: 'https://media.api-sports.io/flags/us.svg',
  homeId: '25',
  homeName: 'Miami Dolphins',
  homeLogo: 'https://media.api-sports.io/american-football/teams/25.png',
  awayId: '7',
  awayName: 'Detroit Lions',
  awayLogo: 'https://media.api-sports.io/american-football/teams/7.png',
  homeQ1: '14',
  homeQ2: '3',
  homeQ3: '14',
  homeQ4: '7',
  homeOt: '',
  homeTotal: '38',
  awayQ1: '7',
  awayQ2: '10',
  awayQ3: '3',
  awayQ4: '6',
  awayOt: '',
  awayTotal: '26',
};

export function gameToFormValues(item: NflGameItem): NflGameFormValues {
  return {
    ...EMPTY_NFL_GAME_FORM,
    gameId: String(item.game.id),
    queryGameId: String(item.game.id),
    stage: item.game.stage ?? '',
    week: item.game.week ?? '',
    dateTimezone: item.game.date?.timezone ?? 'UTC',
    dateDate: item.game.date?.date ?? '',
    dateTime: item.game.date?.time ?? '',
    dateTimestamp: item.game.date?.timestamp != null ? String(item.game.date.timestamp) : '',
    venueName: item.game.venue?.name ?? '',
    venueCity: item.game.venue?.city ?? '',
    statusShort: item.game.status?.short ?? '',
    statusLong: item.game.status?.long ?? '',
    leagueId: String(item.league.id),
    leagueName: item.league.name,
    leagueSeason: item.league.season != null ? String(item.league.season) : '',
    leagueLogo: item.league.logo ?? '',
    leagueCountryName: item.league.country?.name ?? 'USA',
    leagueCountryCode: item.league.country?.code ?? '',
    leagueCountryFlag: item.league.country?.flag ?? '',
    homeId: String(item.teams.home.id),
    homeName: item.teams.home.name,
    homeLogo: item.teams.home.logo ?? '',
    awayId: String(item.teams.away.id),
    awayName: item.teams.away.name,
    awayLogo: item.teams.away.logo ?? '',
    homeQ1: scoreField(item.scores?.home?.quarter_1),
    homeQ2: scoreField(item.scores?.home?.quarter_2),
    homeQ3: scoreField(item.scores?.home?.quarter_3),
    homeQ4: scoreField(item.scores?.home?.quarter_4),
    homeOt: scoreField(item.scores?.home?.overtime),
    homeTotal: scoreField(item.scores?.home?.total),
    awayQ1: scoreField(item.scores?.away?.quarter_1),
    awayQ2: scoreField(item.scores?.away?.quarter_2),
    awayQ3: scoreField(item.scores?.away?.quarter_3),
    awayQ4: scoreField(item.scores?.away?.quarter_4),
    awayOt: scoreField(item.scores?.away?.overtime),
    awayTotal: scoreField(item.scores?.away?.total),
  };
}

function scoreField(value: number | null | undefined): string {
  return value != null ? String(value) : '';
}

export function applyTeamToGameSide(
  values: NflGameFormValues,
  side: 'home' | 'away',
  team: NflTeamItem,
): NflGameFormValues {
  const prefix = side === 'home' ? 'home' : 'away';
  return {
    ...values,
    [`${prefix}Id`]: String(team.id),
    [`${prefix}Name`]: team.name,
    [`${prefix}Logo`]: team.logo ?? '',
  };
}

export function validateNflGameForm(
  values: NflGameFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') {
    const hasId = values.queryGameId.trim();
    const hasLeagueSeason = values.queryLeague.trim() && values.querySeason.trim();
    if (!hasId && !hasLeagueSeason) {
      return 'Indica league+season o un ID de partido para consultar.';
    }
    return null;
  }
  if (mode === 'delete') {
    if (!values.gameId.trim()) return 'El ID del partido es obligatorio para eliminar.';
    return null;
  }
  const gameId = parseRequiredInt(values.gameId, 'ID');
  if (gameId === 'invalid') return 'El ID del partido debe ser un entero válido.';
  if (!values.homeName.trim() || !values.awayName.trim()) {
    return 'Los equipos local y visitante son obligatorios.';
  }
  if (mode === 'edit' && !values.gameId.trim()) return 'El ID del partido es obligatorio para editar.';
  for (const label of ['home', 'away'] as const) {
    for (const q of ['Q1', 'Q2', 'Q3', 'Q4', 'Ot', 'Total'] as const) {
      const key = `${label}${q}` as keyof NflGameFormValues;
      const parsed = parseOptionalInt(String(values[key]));
      if (parsed === 'invalid') return `Marcador ${label} ${q}: entero inválido.`;
    }
  }
  return null;
}

function buildScoreSide(values: NflGameFormValues, side: 'home' | 'away'): NflGameScoreSide {
  const prefix = side === 'home' ? 'home' : 'away';
  const get = (q: string): number | null => {
    const parsed = parseOptionalInt(String(values[`${prefix}${q}` as keyof NflGameFormValues]));
    return parsed === 'invalid' ? null : parsed;
  };
  return {
    quarter_1: get('Q1'),
    quarter_2: get('Q2'),
    quarter_3: get('Q3'),
    quarter_4: get('Q4'),
    overtime: get('Ot'),
    total: get('Total'),
  };
}

function parseId(value: string): number | string {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
}

export function buildNflGameBody(values: NflGameFormValues): NflGameItem {
  const timestamp = parseOptionalNumber(values.dateTimestamp);
  return {
    game: {
      id: parseId(values.gameId),
      stage: nullableString(values.stage),
      week: nullableString(values.week),
      date: {
        timezone: nullableString(values.dateTimezone),
        date: nullableString(values.dateDate),
        time: nullableString(values.dateTime),
        timestamp: timestamp === 'invalid' ? null : timestamp,
      },
      venue: {
        name: nullableString(values.venueName),
        city: nullableString(values.venueCity),
      },
      status: {
        short: nullableString(values.statusShort),
        long: nullableString(values.statusLong),
        timer: null,
      },
    },
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
    teams: {
      home: {
        id: parseId(values.homeId),
        name: values.homeName.trim(),
        logo: nullableString(values.homeLogo),
      },
      away: {
        id: parseId(values.awayId),
        name: values.awayName.trim(),
        logo: nullableString(values.awayLogo),
      },
    },
    scores: {
      home: buildScoreSide(values, 'home'),
      away: buildScoreSide(values, 'away'),
    },
  };
}
