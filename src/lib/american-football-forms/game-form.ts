import type {
  AmericanFootballGameCreate,
  AmericanFootballGameItem,
  AmericanFootballTeamItem,
} from '../american-football-bff-types';
import {
  nullableString,
  parseOptionalInt,
  parseOptionalNumber,
  requireCanonicalId,
} from './shared';

export interface AmericanFootballGameFormValues {
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

export const EMPTY_AMERICAN_FOOTBALL_GAME_FORM: AmericanFootballGameFormValues = {
  queryLeague: '',
  querySeason: '2022',
  queryTimezone: 'UTC',
  queryTeam: '',
  queryGameId: '',
  gameId: '',
  replaceOnPatch: false,
  stage: 'Regular Season',
  week: '',
  dateTimezone: 'UTC',
  dateDate: '',
  dateTime: '',
  dateTimestamp: '',
  venueName: '',
  venueCity: '',
  statusShort: 'NS',
  statusLong: 'Not Started',
  leagueId: '',
  leagueName: '',
  leagueSeason: '2022',
  leagueLogo: '',
  leagueCountryName: 'USA',
  leagueCountryCode: 'US',
  leagueCountryFlag: '',
  homeId: '',
  homeName: '',
  homeLogo: '',
  awayId: '',
  awayName: '',
  awayLogo: '',
  homeQ1: '',
  homeQ2: '',
  homeQ3: '',
  homeQ4: '',
  homeOt: '',
  homeTotal: '',
  awayQ1: '',
  awayQ2: '',
  awayQ3: '',
  awayQ4: '',
  awayOt: '',
  awayTotal: '',
};

export function gameToFormValues(item: AmericanFootballGameItem): AmericanFootballGameFormValues {
  return {
    ...EMPTY_AMERICAN_FOOTBALL_GAME_FORM,
    gameId: item.game.id,
    queryGameId: item.game.id,
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
    leagueId: item.league.id,
    leagueName: item.league.name,
    leagueSeason: item.league.season != null ? String(item.league.season) : '',
    leagueLogo: item.league.logo ?? '',
    leagueCountryName: item.league.country?.name ?? 'USA',
    leagueCountryCode: item.league.country?.code ?? '',
    leagueCountryFlag: item.league.country?.flag ?? '',
    homeId: item.teams.home.id,
    homeName: item.teams.home.name,
    homeLogo: item.teams.home.logo ?? '',
    awayId: item.teams.away.id,
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
  values: AmericanFootballGameFormValues,
  side: 'home' | 'away',
  team: AmericanFootballTeamItem,
): AmericanFootballGameFormValues {
  const prefix = side === 'home' ? 'home' : 'away';
  return {
    ...values,
    [`${prefix}Id`]: team.id,
    [`${prefix}Name`]: team.name,
    [`${prefix}Logo`]: team.logo ?? '',
  };
}

export function validateAmericanFootballGameForm(
  values: AmericanFootballGameFormValues,
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
    if (requireCanonicalId(values.gameId, 'ID') === 'invalid') {
      return 'Selecciona un partido de la lista para eliminar.';
    }
    return null;
  }
  if (!values.homeName.trim() || !values.awayName.trim()) {
    return 'Selecciona equipos local y visitante.';
  }
  if (requireCanonicalId(values.homeId, 'Local') === 'invalid') {
    return 'El equipo local debe ser un UUID válido (selecciónalo de la lista).';
  }
  if (requireCanonicalId(values.awayId, 'Visitante') === 'invalid') {
    return 'El equipo visitante debe ser un UUID válido (selecciónalo de la lista).';
  }
  if (requireCanonicalId(values.leagueId || values.queryLeague, 'Liga') === 'invalid') {
    return 'Indica el UUID de la liga (query o embebida).';
  }
  if (mode === 'edit' && requireCanonicalId(values.gameId, 'ID') === 'invalid') {
    return 'Selecciona un partido de la lista para editar.';
  }
  for (const label of ['home', 'away'] as const) {
    for (const q of ['Q1', 'Q2', 'Q3', 'Q4', 'Ot', 'Total'] as const) {
      const key = `${label}${q}` as keyof AmericanFootballGameFormValues;
      const parsed = parseOptionalInt(String(values[key]));
      if (parsed === 'invalid') return `Marcador ${label} ${q}: entero inválido.`;
    }
  }
  return null;
}

function buildScoreSide(values: AmericanFootballGameFormValues, side: 'home' | 'away') {
  const prefix = side === 'home' ? 'home' : 'away';
  const get = (q: string): number | null => {
    const parsed = parseOptionalInt(String(values[`${prefix}${q}` as keyof AmericanFootballGameFormValues]));
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

export function buildAmericanFootballGameBody(values: AmericanFootballGameFormValues): AmericanFootballGameCreate {
  const timestamp = parseOptionalNumber(values.dateTimestamp);
  return {
    game: {
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
    teams: {
      home: {
        id: values.homeId.trim(),
        name: values.homeName.trim(),
        logo: nullableString(values.homeLogo),
      },
      away: {
        id: values.awayId.trim(),
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
