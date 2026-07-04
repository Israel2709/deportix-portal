import { ApiClientError, apiDelete, apiGet, apiPatch, apiPost } from './api';
import type {
  AmericanFootballEnvelope,
  AmericanFootballGameItem,
  AmericanFootballLeagueItem,
  AmericanFootballSeasonBody,
  AmericanFootballStandingItem,
  AmericanFootballTeamItem,
  AmericanFootballTimezonePatchBody,
  AmericanFootballTimezonePostBody,
} from './american-football-bff-types';

function buildQuery(params: Record<string, string | number | undefined | null | boolean>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      qs.set(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

/** Extract a human-readable message from an api-sports American football error envelope. */
export function parseAmericanFootballApiError(body: unknown, status: number): ApiClientError {
  if (body && typeof body === 'object' && 'errors' in body) {
    const errors = (body as AmericanFootballEnvelope<unknown>).errors;
    if (Array.isArray(errors) && errors.length === 0) {
      return new ApiClientError(`La solicitud falló (${status})`, 'AMERICAN_FOOTBALL_ERROR', status);
    }
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const messages = Object.values(errors as Record<string, string>).filter(Boolean);
      if (messages.length > 0) {
        return new ApiClientError(messages.join(' · '), 'AMERICAN_FOOTBALL_ERROR', status);
      }
    }
  }
  return new ApiClientError(`La solicitud falló (${status})`, 'AMERICAN_FOOTBALL_ERROR', status);
}

async function americanFootballRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<AmericanFootballEnvelope<T>> {
  if (method === 'GET') return apiGet<AmericanFootballEnvelope<T>>(path);
  if (method === 'POST') return apiPost<AmericanFootballEnvelope<T>>(path, body);
  if (method === 'PATCH') return apiPatch<AmericanFootballEnvelope<T>>(path, body);
  await apiDelete(path, body);
  return { get: '', parameters: [], errors: [], results: 0, response: [] };
}

// Country CRUD: use `@/lib/catalog-api` (GET/POST/PATCH/DELETE /v1/countries) — global catalog shared by all sports.

// --- Leagues ---

export interface AmericanFootballLeagueQuery {
  id?: string | number;
  name?: string;
  country_id?: string;
  country?: string;
  type?: string;
  season?: string | number;
  search?: string;
}

export async function getAmericanFootballLeagues(query: AmericanFootballLeagueQuery = {}): Promise<AmericanFootballEnvelope<AmericanFootballLeagueItem>> {
  return americanFootballRequest('GET', `/american-football/leagues${buildQuery(query as Record<string, string | number | undefined | null>)}`);
}

export async function createAmericanFootballLeague(body: AmericanFootballLeagueItem): Promise<AmericanFootballEnvelope<AmericanFootballLeagueItem>> {
  return americanFootballRequest('POST', '/american-football/leagues', body);
}

export async function updateAmericanFootballLeague(
  externalId: string | number,
  body: AmericanFootballLeagueItem,
): Promise<AmericanFootballEnvelope<AmericanFootballLeagueItem>> {
  return americanFootballRequest('PATCH', `/american-football/leagues${buildQuery({ id: externalId })}`, body);
}

export async function deleteAmericanFootballLeague(externalId: string | number): Promise<void> {
  await americanFootballRequest('DELETE', `/american-football/leagues${buildQuery({ id: externalId })}`);
}

// --- Seasons ---

export async function getAmericanFootballSeasons(
  league: string | number,
): Promise<AmericanFootballEnvelope<number>> {
  return americanFootballRequest('GET', `/american-football/seasons${buildQuery({ league })}`);
}

export async function createAmericanFootballSeason(
  league: string | number,
  body: AmericanFootballSeasonBody,
): Promise<AmericanFootballEnvelope<number>> {
  return americanFootballRequest('POST', `/american-football/seasons${buildQuery({ league })}`, body);
}

export async function deleteAmericanFootballSeason(
  league: string | number,
  body: AmericanFootballSeasonBody,
): Promise<void> {
  await americanFootballRequest('DELETE', `/american-football/seasons${buildQuery({ league })}`, body);
}

// --- Teams ---

export interface AmericanFootballTeamQuery {
  league: string | number;
  season: string | number;
}

export async function getAmericanFootballTeams(query: AmericanFootballTeamQuery): Promise<AmericanFootballEnvelope<AmericanFootballTeamItem>> {
  return americanFootballRequest('GET', `/american-football/teams${buildQuery(query as unknown as Record<string, string | number | undefined | null>)}`);
}

export async function createAmericanFootballTeam(
  leagueId: string | number,
  body: AmericanFootballTeamItem,
): Promise<AmericanFootballEnvelope<AmericanFootballTeamItem>> {
  return americanFootballRequest('POST', `/american-football/teams${buildQuery({ league: leagueId })}`, body);
}

export async function updateAmericanFootballTeam(
  teamId: string | number,
  body: AmericanFootballTeamItem,
): Promise<AmericanFootballEnvelope<AmericanFootballTeamItem>> {
  return americanFootballRequest('PATCH', `/american-football/teams${buildQuery({ id: teamId })}`, body);
}

export async function deleteAmericanFootballTeam(teamId: string | number): Promise<void> {
  await americanFootballRequest('DELETE', `/american-football/teams${buildQuery({ id: teamId })}`);
}

// --- Games ---

export interface AmericanFootballGameQuery {
  league?: string | number;
  season?: string | number;
  timezone?: string;
  id?: string | number;
  team?: string | number;
}

export async function getAmericanFootballGames(query: AmericanFootballGameQuery = {}): Promise<AmericanFootballEnvelope<AmericanFootballGameItem>> {
  if (query.id != null && Object.keys(query).length === 1) {
    return americanFootballRequest('GET', `/american-football/games/${encodeURIComponent(String(query.id))}`);
  }
  return americanFootballRequest('GET', `/american-football/games${buildQuery(query as Record<string, string | number | undefined | null>)}`);
}

export async function createAmericanFootballGame(body: AmericanFootballGameItem): Promise<AmericanFootballEnvelope<AmericanFootballGameItem>> {
  return americanFootballRequest('POST', '/american-football/games', body);
}

export async function updateAmericanFootballGame(
  gameId: string | number,
  body: AmericanFootballGameItem,
  replace = false,
): Promise<AmericanFootballEnvelope<AmericanFootballGameItem>> {
  return americanFootballRequest(
    'PATCH',
    `/american-football/games/${encodeURIComponent(String(gameId))}${buildQuery({ replace: replace ? 'true' : undefined })}`,
    body,
  );
}

export async function deleteAmericanFootballGame(gameId: string | number): Promise<void> {
  await americanFootballRequest('DELETE', `/american-football/games/${encodeURIComponent(String(gameId))}`);
}

// --- Standings ---

export interface AmericanFootballStandingQuery {
  league: string | number;
  season: string | number;
  conference?: string;
}

export async function getAmericanFootballStandings(
  query: AmericanFootballStandingQuery,
): Promise<AmericanFootballEnvelope<AmericanFootballStandingItem>> {
  return americanFootballRequest('GET', `/american-football/standings${buildQuery(query as unknown as Record<string, string | number | undefined | null>)}`);
}

export async function createAmericanFootballStanding(
  body: AmericanFootballStandingItem,
): Promise<AmericanFootballEnvelope<AmericanFootballStandingItem>> {
  return americanFootballRequest('POST', '/american-football/standings', body);
}

export async function updateAmericanFootballStanding(
  standingId: string | number,
  body: AmericanFootballStandingItem,
): Promise<AmericanFootballEnvelope<AmericanFootballStandingItem>> {
  return americanFootballRequest('PATCH', `/american-football/standings${buildQuery({ id: standingId })}`, body);
}

export async function deleteAmericanFootballStanding(standingId: string | number): Promise<void> {
  await americanFootballRequest('DELETE', `/american-football/standings${buildQuery({ id: standingId })}`);
}

// --- Timezone ---

export async function getAmericanFootballTimezones(): Promise<AmericanFootballEnvelope<string>> {
  return americanFootballRequest('GET', '/american-football/timezone');
}

export async function createAmericanFootballTimezone(
  body: AmericanFootballTimezonePostBody,
): Promise<AmericanFootballEnvelope<string>> {
  return americanFootballRequest('POST', '/american-football/timezone', body);
}

export async function updateAmericanFootballTimezone(
  body: AmericanFootballTimezonePatchBody,
): Promise<AmericanFootballEnvelope<string>> {
  return americanFootballRequest('PATCH', '/american-football/timezone', body);
}

export async function deleteAmericanFootballTimezone(body: AmericanFootballTimezonePostBody): Promise<void> {
  await americanFootballRequest('DELETE', '/american-football/timezone', body);
}
