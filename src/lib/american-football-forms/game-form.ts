import type {
  AmericanFootballGameCreate,
  AmericanFootballGameItem,
  AmericanFootballTeamItem,
} from '../american-football-bff-types';
import {
  nullableString,
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
}

export const EMPTY_AMERICAN_FOOTBALL_GAME_FORM: AmericanFootballGameFormValues = {
  queryLeague: '',
  querySeason: '',
  queryTimezone: 'UTC',
  queryTeam: '',
  queryGameId: '',
  gameId: '',
  replaceOnPatch: false,
  stage: '',
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
  leagueSeason: '',
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
};

export function gameToFormValues(item: AmericanFootballGameItem): AmericanFootballGameFormValues {
  const season = item.league.season != null ? String(item.league.season) : '';
  return {
    ...EMPTY_AMERICAN_FOOTBALL_GAME_FORM,
    queryLeague: item.league.id,
    querySeason: season,
    leagueSeason: season,
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
  };
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
      return 'Selecciona liga y temporada, o indica un ID de partido.';
    }
    if (!hasId) {
      if (!values.queryLeague.trim()) return 'Selecciona una liga.';
      if (!values.querySeason.trim()) return 'Selecciona una temporada.';
    }
    return null;
  }
  if (mode === 'delete') {
    if (requireCanonicalId(values.gameId, 'ID') === 'invalid') {
      return 'Selecciona un partido de la lista para eliminar.';
    }
    return null;
  }
  if (mode === 'create') {
    if (!values.queryLeague.trim()) return 'Selecciona una liga.';
    if (!values.querySeason.trim()) return 'Selecciona una temporada.';
    if (!values.stage.trim()) return 'Selecciona una etapa.';
  }
  if (!values.homeName.trim() || !values.awayName.trim()) {
    return 'Selecciona equipos local y visitante.';
  }
  if (values.homeId && values.awayId && values.homeId === values.awayId) {
    return 'Local y visitante deben ser equipos distintos.';
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
  return null;
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
  };
}
