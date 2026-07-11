import type {
  AmericanFootballGameItem,
  AmericanFootballLeagueItem,
  AmericanFootballTeamItem,
} from '@/lib/american-football-bff-types';
import type { MatchEditPatch } from '@/lib/match-edits';
import {
  buildAmericanFootballGameBody,
  gameToFormValues,
} from '@/lib/american-football-forms/game-form';
import type { League, Match, Season, Team } from '@/lib/types';

function gameDateIso(item: AmericanFootballGameItem): string | null {
  const timestamp = item.game.date?.timestamp;
  if (timestamp != null) return new Date(timestamp * 1000).toISOString();

  const date = item.game.date?.date;
  const time = item.game.date?.time;
  if (!date) return null;
  if (!time) return `${date}T00:00:00.000Z`;
  return `${date}T${time}:00.000Z`;
}

export function americanFootballGameToMatch(
  item: AmericanFootballGameItem,
  leagueId: string,
  seasonYear: number,
): Match {
  return {
    id: item.game.id,
    externalId: item.game.id,
    sport: 'american-football',
    leagueId,
    seasonId: `af-${leagueId}-${seasonYear}`,
    date: gameDateIso(item),
    status: item.game.status?.short ?? null,
    round: item.game.week ?? null,
    venue: item.game.venue?.name ?? null,
    home: {
      teamId: item.teams.home.id,
      name: item.teams.home.name,
      logo: item.teams.home.logo ?? null,
      score: item.scores?.home?.total ?? null,
    },
    away: {
      teamId: item.teams.away.id,
      name: item.teams.away.name,
      logo: item.teams.away.logo ?? null,
      score: item.scores?.away?.total ?? null,
    },
    updatedAt: null,
  };
}

export function americanFootballTeamToTeam(
  item: AmericanFootballTeamItem,
  leagueId: string,
): Team {
  return {
    id: item.id,
    externalId: item.id,
    sport: 'american-football',
    leagueId,
    name: item.name,
    code: null,
    country: null,
    logo: item.logo ?? null,
    altName: null,
    altLogo: item.altLogo ?? null,
    city: null,
    conference: null,
    division: null,
    venue: null,
    updatedAt: null,
  };
}

export function americanFootballLeagueToLeague(item: AmericanFootballLeagueItem): League {
  return {
    id: item.league.id,
    externalId: item.league.id,
    name: item.league.name,
    type: item.league.type ?? null,
    sport: 'american-football',
    country: item.country.name,
    logo: item.league.logo ?? null,
    altLogo: item.league.altLogo ?? null,
    updatedAt: null,
  };
}

export function americanFootballSeasonsToSeasons(
  leagueId: string,
  years: number[],
  leagueItem?: AmericanFootballLeagueItem | null,
): Season[] {
  const seasonMeta = new Map(
    (leagueItem?.seasons ?? []).map((season) => [season.year, season]),
  );

  return years.map((year) => {
    const meta = seasonMeta.get(year);
    return {
      id: `af-${leagueId}-${year}`,
      leagueId,
      year,
      current: meta?.current ?? false,
      startDate: meta?.start ?? null,
      endDate: meta?.end ?? null,
      externalId: String(year),
    };
  });
}

export function matchEditPatchToGameUpdate(
  game: AmericanFootballGameItem,
  patch: MatchEditPatch,
): import('@/lib/american-football-bff-types').AmericanFootballGameCreate {
  const values = gameToFormValues(game);

  if (patch.date) {
    const parsed = new Date(patch.date);
    values.dateDate = parsed.toISOString().slice(0, 10);
    values.dateTime = parsed.toISOString().slice(11, 16);
    values.dateTimestamp = String(Math.floor(parsed.getTime() / 1000));
  }
  if (patch.status) values.statusShort = patch.status;
  if (patch.round != null) values.week = patch.round;
  if (patch.venue != null) values.venueName = patch.venue;
  if (patch.homeTeamId) values.homeId = patch.homeTeamId;
  if (patch.awayTeamId) values.awayId = patch.awayTeamId;
  if (patch.homeScore != null) {
    values.homeName = values.homeName || game.teams.home.name;
  }
  if (patch.awayScore != null) {
    values.awayName = values.awayName || game.teams.away.name;
  }

  const body = buildAmericanFootballGameBody(values);
  if (patch.homeScore != null) {
    body.scores = {
      ...body.scores,
      home: { ...body.scores?.home, total: patch.homeScore },
    };
  }
  if (patch.awayScore != null) {
    body.scores = {
      ...body.scores,
      away: { ...body.scores?.away, total: patch.awayScore },
    };
  }

  return body;
}
