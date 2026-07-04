import type { NflLeagueItem, NflLeagueSeason, NflLeagueSeasonCoverage } from '../nfl-bff-types';
import { nullableString, parseRequiredInt } from './shared';

export interface NflLeagueSeasonFormValues {
  year: string;
  start: string;
  end: string;
  current: boolean;
  coverageGamesEvents: boolean;
  coverageGamesTeamStats: boolean;
  coverageGamesPlayerStats: boolean;
  coverageSeasonPlayerStats: boolean;
  coveragePlayers: boolean;
  coverageInjuries: boolean;
  coverageStandings: boolean;
}

export interface NflLeagueFormValues {
  externalId: string;
  leagueId: string;
  leagueName: string;
  leagueType: string;
  leagueLogo: string;
  countryName: string;
  countryCode: string;
  countryFlag: string;
  seasons: NflLeagueSeasonFormValues[];
}

export const DEFAULT_NFL_LEAGUE_SEASON: NflLeagueSeasonFormValues = {
  year: '2022',
  start: '2022-08-05',
  end: '2023-02-12',
  current: true,
  coverageGamesEvents: true,
  coverageGamesTeamStats: true,
  coverageGamesPlayerStats: true,
  coverageSeasonPlayerStats: true,
  coveragePlayers: true,
  coverageInjuries: true,
  coverageStandings: true,
};

export const EMPTY_NFL_LEAGUE_FORM: NflLeagueFormValues = {
  externalId: '1',
  leagueId: '1',
  leagueName: 'NFL',
  leagueType: 'league',
  leagueLogo: 'https://media.api-sports.io/american-football/leagues/1.png',
  countryName: 'USA',
  countryCode: 'US',
  countryFlag: 'https://media.api-sports.io/flags/us.svg',
  seasons: [{ ...DEFAULT_NFL_LEAGUE_SEASON }],
};

export function leagueToFormValues(item: NflLeagueItem): NflLeagueFormValues {
  return {
    externalId: String(item.league.id),
    leagueId: String(item.league.id),
    leagueName: item.league.name,
    leagueType: item.league.type ?? 'league',
    leagueLogo: item.league.logo ?? '',
    countryName: item.country.name,
    countryCode: item.country.code ?? '',
    countryFlag: item.country.flag ?? '',
    seasons: item.seasons.map(seasonFormFromSeason),
  };
}

function seasonFormFromSeason(season: NflLeagueSeason): NflLeagueSeasonFormValues {
  const cov = season.coverage;
  return {
    year: String(season.year),
    start: season.start ?? '',
    end: season.end ?? '',
    current: season.current,
    coverageGamesEvents: cov?.games?.events ?? false,
    coverageGamesTeamStats: cov?.games?.statisitcs?.teams ?? false,
    coverageGamesPlayerStats: cov?.games?.statisitcs?.players ?? false,
    coverageSeasonPlayerStats: cov?.statistics?.season?.players ?? false,
    coveragePlayers: cov?.players ?? false,
    coverageInjuries: cov?.injuries ?? false,
    coverageStandings: cov?.standings ?? false,
  };
}

export function validateNflLeagueForm(values: NflLeagueFormValues, mode: 'create' | 'edit' | 'delete'): string | null {
  if (mode === 'delete') {
    if (!values.externalId.trim()) return 'El ID externo es obligatorio para eliminar.';
    return null;
  }
  if (!values.leagueId.trim()) return 'El ID de la liga es obligatorio.';
  if (!values.leagueName.trim()) return 'El nombre de la liga es obligatorio.';
  if (!values.countryName.trim()) return 'El país es obligatorio.';
  if (values.seasons.length === 0) return 'Agrega al menos una temporada.';
  for (const [index, season] of values.seasons.entries()) {
    const year = parseRequiredInt(season.year, 'año');
    if (year === 'invalid') return `Temporada ${index + 1}: el año no es válido.`;
  }
  if (mode === 'edit' && !values.externalId.trim()) return 'El ID externo es obligatorio para editar.';
  return null;
}

function buildCoverage(season: NflLeagueSeasonFormValues): NflLeagueSeasonCoverage {
  return {
    games: {
      events: season.coverageGamesEvents,
      statisitcs: {
        teams: season.coverageGamesTeamStats,
        players: season.coverageGamesPlayerStats,
      },
    },
    statistics: { season: { players: season.coverageSeasonPlayerStats } },
    players: season.coveragePlayers,
    injuries: season.coverageInjuries,
    standings: season.coverageStandings,
  };
}

export function buildNflLeagueBody(values: NflLeagueFormValues): NflLeagueItem {
  const leagueId = values.leagueId.trim();
  return {
    league: {
      id: /^\d+$/.test(leagueId) ? Number(leagueId) : leagueId,
      name: values.leagueName.trim(),
      type: nullableString(values.leagueType),
      logo: nullableString(values.leagueLogo),
    },
    country: {
      name: values.countryName.trim(),
      code: nullableString(values.countryCode),
      flag: nullableString(values.countryFlag),
    },
    seasons: values.seasons.map((season) => ({
      year: Number(season.year.trim()),
      start: nullableString(season.start),
      end: nullableString(season.end),
      current: season.current,
      coverage: buildCoverage(season),
    })),
  };
}
