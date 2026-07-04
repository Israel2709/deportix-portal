import { ApiClientError, apiDelete, apiGet, apiPatch, apiPost } from './api';
import type {
  NflCountryItem,
  NflEnvelope,
  NflGameItem,
  NflLeagueItem,
  NflSeasonBody,
  NflStandingItem,
  NflTeamItem,
  NflTimezonePatchBody,
  NflTimezonePostBody,
} from './nfl-bff-types';

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

/** Extract a human-readable message from an api-sports NFL error envelope. */
export function parseNflApiError(body: unknown, status: number): ApiClientError {
  if (body && typeof body === 'object' && 'errors' in body) {
    const errors = (body as NflEnvelope<unknown>).errors;
    if (Array.isArray(errors) && errors.length === 0) {
      return new ApiClientError(`La solicitud falló (${status})`, 'NFL_ERROR', status);
    }
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const messages = Object.values(errors as Record<string, string>).filter(Boolean);
      if (messages.length > 0) {
        return new ApiClientError(messages.join(' · '), 'NFL_ERROR', status);
      }
    }
  }
  return new ApiClientError(`La solicitud falló (${status})`, 'NFL_ERROR', status);
}

async function nflRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<NflEnvelope<T>> {
  if (method === 'GET') return apiGet<NflEnvelope<T>>(path);
  if (method === 'POST') return apiPost<NflEnvelope<T>>(path, body);
  if (method === 'PATCH') return apiPatch<NflEnvelope<T>>(path, body);
  await apiDelete(path, body);
  return { get: '', parameters: [], errors: [], results: 0, response: [] };
}

// --- Countries ---

export async function getNflCountries(name?: string): Promise<NflEnvelope<NflCountryItem>> {
  return nflRequest('GET', `/nfl/countries${buildQuery({ name })}`);
}

export async function createNflCountry(body: NflCountryItem): Promise<NflEnvelope<NflCountryItem>> {
  return nflRequest('POST', '/nfl/countries', body);
}

export async function updateNflCountry(body: NflCountryItem): Promise<NflEnvelope<NflCountryItem>> {
  return nflRequest('PATCH', '/nfl/countries', body);
}

export async function deleteNflCountry(body: NflCountryItem): Promise<void> {
  await nflRequest('DELETE', '/nfl/countries', body);
}

// --- Leagues ---

export interface NflLeagueQuery {
  id?: string | number;
  name?: string;
  country_id?: string;
  country?: string;
  type?: string;
  season?: string | number;
  search?: string;
}

export async function getNflLeagues(query: NflLeagueQuery = {}): Promise<NflEnvelope<NflLeagueItem>> {
  return nflRequest('GET', `/nfl/leagues${buildQuery(query as Record<string, string | number | undefined | null>)}`);
}

export async function createNflLeague(body: NflLeagueItem): Promise<NflEnvelope<NflLeagueItem>> {
  return nflRequest('POST', '/nfl/leagues', body);
}

export async function updateNflLeague(
  externalId: string | number,
  body: NflLeagueItem,
): Promise<NflEnvelope<NflLeagueItem>> {
  return nflRequest('PATCH', `/nfl/leagues${buildQuery({ id: externalId })}`, body);
}

export async function deleteNflLeague(externalId: string | number): Promise<void> {
  await nflRequest('DELETE', `/nfl/leagues${buildQuery({ id: externalId })}`);
}

// --- Seasons ---

export async function getNflSeasons(): Promise<NflEnvelope<number>> {
  return nflRequest('GET', '/nfl/seasons');
}

export async function createNflSeason(body: NflSeasonBody): Promise<NflEnvelope<number>> {
  return nflRequest('POST', '/nfl/seasons', body);
}

export async function deleteNflSeason(body: NflSeasonBody): Promise<void> {
  await nflRequest('DELETE', '/nfl/seasons', body);
}

// --- Teams ---

export interface NflTeamQuery {
  league: string | number;
  season: string | number;
}

export async function getNflTeams(query: NflTeamQuery): Promise<NflEnvelope<NflTeamItem>> {
  return nflRequest('GET', `/nfl/teams${buildQuery(query as unknown as Record<string, string | number | undefined | null>)}`);
}

export async function createNflTeam(
  leagueId: string | number,
  body: NflTeamItem,
): Promise<NflEnvelope<NflTeamItem>> {
  return nflRequest('POST', `/nfl/teams${buildQuery({ league: leagueId })}`, body);
}

export async function updateNflTeam(
  teamId: string | number,
  body: NflTeamItem,
): Promise<NflEnvelope<NflTeamItem>> {
  return nflRequest('PATCH', `/nfl/teams${buildQuery({ id: teamId })}`, body);
}

export async function deleteNflTeam(teamId: string | number): Promise<void> {
  await nflRequest('DELETE', `/nfl/teams${buildQuery({ id: teamId })}`);
}

// --- Games ---

export interface NflGameQuery {
  league?: string | number;
  season?: string | number;
  timezone?: string;
  id?: string | number;
  team?: string | number;
}

export async function getNflGames(query: NflGameQuery = {}): Promise<NflEnvelope<NflGameItem>> {
  if (query.id != null && Object.keys(query).length === 1) {
    return nflRequest('GET', `/nfl/games/${encodeURIComponent(String(query.id))}`);
  }
  return nflRequest('GET', `/nfl/games${buildQuery(query as Record<string, string | number | undefined | null>)}`);
}

export async function createNflGame(body: NflGameItem): Promise<NflEnvelope<NflGameItem>> {
  return nflRequest('POST', '/nfl/games', body);
}

export async function updateNflGame(
  gameId: string | number,
  body: NflGameItem,
  replace = false,
): Promise<NflEnvelope<NflGameItem>> {
  return nflRequest(
    'PATCH',
    `/nfl/games/${encodeURIComponent(String(gameId))}${buildQuery({ replace: replace ? 'true' : undefined })}`,
    body,
  );
}

export async function deleteNflGame(gameId: string | number): Promise<void> {
  await nflRequest('DELETE', `/nfl/games/${encodeURIComponent(String(gameId))}`);
}

// --- Standings ---

export interface NflStandingQuery {
  league: string | number;
  season: string | number;
  conference?: string;
}

export async function getNflStandings(
  query: NflStandingQuery,
): Promise<NflEnvelope<NflStandingItem>> {
  return nflRequest('GET', `/nfl/standings${buildQuery(query as unknown as Record<string, string | number | undefined | null>)}`);
}

export async function createNflStanding(
  body: NflStandingItem,
): Promise<NflEnvelope<NflStandingItem>> {
  return nflRequest('POST', '/nfl/standings', body);
}

export async function updateNflStanding(
  standingId: string | number,
  body: NflStandingItem,
): Promise<NflEnvelope<NflStandingItem>> {
  return nflRequest('PATCH', `/nfl/standings${buildQuery({ id: standingId })}`, body);
}

export async function deleteNflStanding(standingId: string | number): Promise<void> {
  await nflRequest('DELETE', `/nfl/standings${buildQuery({ id: standingId })}`);
}

// --- Timezone ---

export async function getNflTimezones(): Promise<NflEnvelope<string>> {
  return nflRequest('GET', '/nfl/timezone');
}

export async function createNflTimezone(
  body: NflTimezonePostBody,
): Promise<NflEnvelope<string>> {
  return nflRequest('POST', '/nfl/timezone', body);
}

export async function updateNflTimezone(
  body: NflTimezonePatchBody,
): Promise<NflEnvelope<string>> {
  return nflRequest('PATCH', '/nfl/timezone', body);
}

export async function deleteNflTimezone(body: NflTimezonePostBody): Promise<void> {
  await nflRequest('DELETE', '/nfl/timezone', body);
}
