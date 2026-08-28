import { ApiClientError, apiDelete, apiGet, apiPatch, apiPost } from './api';
import type {
  TennisEntryItem,
  TennisEntryNestedCreate,
  TennisEntryCreate,
  TennisEnvelope,
  TennisMatchCreate,
  TennisMatchItem,
  TennisMatchNestedCreate,
  TennisMatchResultBody,
  TennisMatchStatus,
  TennisPlayerCreate,
  TennisPlayerItem,
  TennisPublishedFilter,
  TennisRoundItem,
  TennisRoundCreate,
  TennisRoundNestedCreate,
  TennisTournamentCreate,
  TennisTournamentItem,
} from './tennis-bff-types';

/** Backoffice lists include drafts and published records. */
export const TENNIS_BACKOFFICE_PUBLISHED: TennisPublishedFilter = 'all';

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

function backofficeQuery(params: Record<string, string | number | undefined | null | boolean>): string {
  return buildQuery({ ...params, published: params.published ?? TENNIS_BACKOFFICE_PUBLISHED });
}

export function parseTennisApiError(body: unknown, status: number): ApiClientError {
  if (body && typeof body === 'object' && 'errors' in body) {
    const errors = (body as TennisEnvelope<unknown>).errors;
    if (Array.isArray(errors) && errors.length === 0) {
      return new ApiClientError(`La solicitud falló (${status})`, 'TENNIS_ERROR', status);
    }
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const messages = Object.values(errors as Record<string, string>).filter(Boolean);
      if (messages.length > 0) {
        return new ApiClientError(messages.join(' · '), 'TENNIS_ERROR', status);
      }
    }
  }
  return new ApiClientError(`La solicitud falló (${status})`, 'TENNIS_ERROR', status);
}

async function tennisRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<TennisEnvelope<T>> {
  if (method === 'GET') return apiGet<TennisEnvelope<T>>(path);
  if (method === 'POST') return apiPost<TennisEnvelope<T>>(path, body);
  if (method === 'PATCH') return apiPatch<TennisEnvelope<T>>(path, body);
  await apiDelete(path, body);
  return { get: '', parameters: [], errors: [], results: 0, response: [] };
}

// --- Players ---

export interface TennisPlayerQuery {
  id?: string;
  search?: string;
  country?: string;
  published?: TennisPublishedFilter;
}

export async function getTennisPlayers(
  query: TennisPlayerQuery = {},
): Promise<TennisEnvelope<TennisPlayerItem>> {
  return tennisRequest('GET', `/tennis/players${backofficeQuery(query as Record<string, string | number | undefined | null>)}`);
}

export async function getTennisPlayer(playerId: string): Promise<TennisEnvelope<TennisPlayerItem>> {
  return tennisRequest('GET', `/tennis/players/${encodeURIComponent(playerId)}`);
}

export async function createTennisPlayer(
  body: TennisPlayerCreate,
): Promise<TennisEnvelope<TennisPlayerItem>> {
  return tennisRequest('POST', '/tennis/players', body);
}

export async function updateTennisPlayer(
  id: string,
  body: TennisPlayerCreate,
): Promise<TennisEnvelope<TennisPlayerItem>> {
  return tennisRequest('PATCH', `/tennis/players${buildQuery({ id })}`, body);
}

export async function updateTennisPlayerById(
  playerId: string,
  body: TennisPlayerCreate,
): Promise<TennisEnvelope<TennisPlayerItem>> {
  return tennisRequest('PATCH', `/tennis/players/${encodeURIComponent(playerId)}`, body);
}

export async function deleteTennisPlayer(id: string): Promise<void> {
  await tennisRequest('DELETE', `/tennis/players${buildQuery({ id })}`);
}

export async function deleteTennisPlayerById(playerId: string): Promise<void> {
  await tennisRequest('DELETE', `/tennis/players/${encodeURIComponent(playerId)}`);
}

// --- Tournaments ---

export interface TennisTournamentQuery {
  id?: string;
  year?: number | string;
  category?: string;
  gender?: string;
  status?: string;
  search?: string;
  published?: TennisPublishedFilter;
}

export async function getTennisTournaments(
  query: TennisTournamentQuery = {},
): Promise<TennisEnvelope<TennisTournamentItem>> {
  return tennisRequest('GET', `/tennis/tournaments${backofficeQuery(query as Record<string, string | number | undefined | null>)}`);
}

export async function getTennisTournament(
  tournamentId: string,
): Promise<TennisEnvelope<TennisTournamentItem>> {
  return tennisRequest('GET', `/tennis/tournaments/${encodeURIComponent(tournamentId)}`);
}

export async function createTennisTournament(
  body: TennisTournamentCreate,
): Promise<TennisEnvelope<TennisTournamentItem>> {
  return tennisRequest('POST', '/tennis/tournaments', body);
}

export async function updateTennisTournament(
  id: string,
  body: TennisTournamentCreate,
): Promise<TennisEnvelope<TennisTournamentItem>> {
  return tennisRequest('PATCH', `/tennis/tournaments${buildQuery({ id })}`, body);
}

export async function updateTennisTournamentById(
  tournamentId: string,
  body: TennisTournamentCreate,
): Promise<TennisEnvelope<TennisTournamentItem>> {
  return tennisRequest('PATCH', `/tennis/tournaments/${encodeURIComponent(tournamentId)}`, body);
}

export async function deleteTennisTournament(id: string): Promise<void> {
  await tennisRequest('DELETE', `/tennis/tournaments${buildQuery({ id })}`);
}

export async function deleteTennisTournamentById(tournamentId: string): Promise<void> {
  await tennisRequest('DELETE', `/tennis/tournaments/${encodeURIComponent(tournamentId)}`);
}

export async function publishTennisTournament(
  tournamentId: string,
): Promise<TennisEnvelope<TennisTournamentItem>> {
  return tennisRequest('POST', `/tennis/tournaments/${encodeURIComponent(tournamentId)}/publish`);
}

// --- Rounds ---

export interface TennisRoundQuery {
  id?: string;
  tournament?: string;
  published?: TennisPublishedFilter;
}

export async function getTennisRounds(
  query: TennisRoundQuery = {},
): Promise<TennisEnvelope<TennisRoundItem>> {
  return tennisRequest('GET', `/tennis/rounds${backofficeQuery(query as Record<string, string | number | undefined | null>)}`);
}

export async function getTennisTournamentRounds(
  tournamentId: string,
  query: { published?: TennisPublishedFilter } = {},
): Promise<TennisEnvelope<TennisRoundItem>> {
  return tennisRequest(
    'GET',
    `/tennis/tournaments/${encodeURIComponent(tournamentId)}/rounds${backofficeQuery(query as Record<string, string | number | undefined | null>)}`,
  );
}

export async function getTennisRound(roundId: string): Promise<TennisEnvelope<TennisRoundItem>> {
  return tennisRequest('GET', `/tennis/rounds/${encodeURIComponent(roundId)}`);
}

export async function createTennisRound(
  body: TennisRoundCreate,
): Promise<TennisEnvelope<TennisRoundItem>> {
  return tennisRequest('POST', '/tennis/rounds', body);
}

export async function createTennisTournamentRound(
  tournamentId: string,
  body: TennisRoundNestedCreate,
): Promise<TennisEnvelope<TennisRoundItem>> {
  return tennisRequest(
    'POST',
    `/tennis/tournaments/${encodeURIComponent(tournamentId)}/rounds`,
    body,
  );
}

export async function updateTennisRound(
  id: string,
  body: TennisRoundNestedCreate,
): Promise<TennisEnvelope<TennisRoundItem>> {
  return tennisRequest('PATCH', `/tennis/rounds${buildQuery({ id })}`, body);
}

export async function updateTennisRoundById(
  roundId: string,
  body: TennisRoundNestedCreate,
): Promise<TennisEnvelope<TennisRoundItem>> {
  return tennisRequest('PATCH', `/tennis/rounds/${encodeURIComponent(roundId)}`, body);
}

export async function deleteTennisRound(id: string): Promise<void> {
  await tennisRequest('DELETE', `/tennis/rounds${buildQuery({ id })}`);
}

export async function deleteTennisRoundById(roundId: string): Promise<void> {
  await tennisRequest('DELETE', `/tennis/rounds/${encodeURIComponent(roundId)}`);
}

// --- Entries ---

export interface TennisEntryQuery {
  id?: string;
  tournament?: string;
  search?: string;
  published?: TennisPublishedFilter;
}

export async function getTennisEntries(
  query: TennisEntryQuery = {},
): Promise<TennisEnvelope<TennisEntryItem>> {
  return tennisRequest('GET', `/tennis/entries${backofficeQuery(query as Record<string, string | number | undefined | null>)}`);
}

export async function getTennisTournamentEntries(
  tournamentId: string,
  query: { search?: string; published?: TennisPublishedFilter } = {},
): Promise<TennisEnvelope<TennisEntryItem>> {
  return tennisRequest(
    'GET',
    `/tennis/tournaments/${encodeURIComponent(tournamentId)}/entries${backofficeQuery(query as Record<string, string | number | undefined | null>)}`,
  );
}

export async function getTennisEntry(entryId: string): Promise<TennisEnvelope<TennisEntryItem>> {
  return tennisRequest('GET', `/tennis/entries/${encodeURIComponent(entryId)}`);
}

export async function createTennisEntry(
  body: TennisEntryCreate,
): Promise<TennisEnvelope<TennisEntryItem>> {
  return tennisRequest('POST', '/tennis/entries', body);
}

export async function createTennisTournamentEntry(
  tournamentId: string,
  body: TennisEntryNestedCreate,
): Promise<TennisEnvelope<TennisEntryItem>> {
  return tennisRequest(
    'POST',
    `/tennis/tournaments/${encodeURIComponent(tournamentId)}/entries`,
    body,
  );
}

export async function updateTennisEntry(
  id: string,
  body: TennisEntryNestedCreate,
): Promise<TennisEnvelope<TennisEntryItem>> {
  return tennisRequest('PATCH', `/tennis/entries${buildQuery({ id })}`, body);
}

export async function updateTennisEntryById(
  entryId: string,
  body: TennisEntryNestedCreate,
): Promise<TennisEnvelope<TennisEntryItem>> {
  return tennisRequest('PATCH', `/tennis/entries/${encodeURIComponent(entryId)}`, body);
}

export async function deleteTennisEntry(id: string): Promise<void> {
  await tennisRequest('DELETE', `/tennis/entries${buildQuery({ id })}`);
}

export async function deleteTennisEntryById(entryId: string): Promise<void> {
  await tennisRequest('DELETE', `/tennis/entries/${encodeURIComponent(entryId)}`);
}

// --- Matches ---

export interface TennisMatchQuery {
  id?: string;
  tournament?: string;
  round?: string;
  status?: TennisMatchStatus;
  published?: TennisPublishedFilter;
}

export async function getTennisMatches(
  query: TennisMatchQuery = {},
): Promise<TennisEnvelope<TennisMatchItem>> {
  return tennisRequest('GET', `/tennis/matches${backofficeQuery(query as Record<string, string | number | undefined | null>)}`);
}

export async function getTennisTournamentMatches(
  tournamentId: string,
  query: { round?: string; status?: TennisMatchStatus; published?: TennisPublishedFilter } = {},
): Promise<TennisEnvelope<TennisMatchItem>> {
  return tennisRequest(
    'GET',
    `/tennis/tournaments/${encodeURIComponent(tournamentId)}/matches${backofficeQuery(query as Record<string, string | number | undefined | null>)}`,
  );
}

export async function getTennisMatch(matchId: string): Promise<TennisEnvelope<TennisMatchItem>> {
  return tennisRequest('GET', `/tennis/matches/${encodeURIComponent(matchId)}`);
}

export async function createTennisMatch(
  body: TennisMatchCreate,
): Promise<TennisEnvelope<TennisMatchItem>> {
  return tennisRequest('POST', '/tennis/matches', body);
}

export async function createTennisTournamentMatch(
  tournamentId: string,
  body: TennisMatchNestedCreate,
): Promise<TennisEnvelope<TennisMatchItem>> {
  return tennisRequest(
    'POST',
    `/tennis/tournaments/${encodeURIComponent(tournamentId)}/matches`,
    body,
  );
}

export async function updateTennisMatch(
  id: string,
  body: TennisMatchNestedCreate,
): Promise<TennisEnvelope<TennisMatchItem>> {
  return tennisRequest('PATCH', `/tennis/matches${buildQuery({ id })}`, body);
}

export async function updateTennisMatchById(
  matchId: string,
  body: TennisMatchNestedCreate,
): Promise<TennisEnvelope<TennisMatchItem>> {
  return tennisRequest('PATCH', `/tennis/matches/${encodeURIComponent(matchId)}`, body);
}

export async function deleteTennisMatch(id: string): Promise<void> {
  await tennisRequest('DELETE', `/tennis/matches${buildQuery({ id })}`);
}

export async function deleteTennisMatchById(matchId: string): Promise<void> {
  await tennisRequest('DELETE', `/tennis/matches/${encodeURIComponent(matchId)}`);
}

export async function recordTennisMatchResult(
  matchId: string,
  body: TennisMatchResultBody,
): Promise<TennisEnvelope<TennisMatchItem>> {
  return tennisRequest('POST', `/tennis/matches/${encodeURIComponent(matchId)}/result`, body);
}

export async function publishTennisMatch(matchId: string): Promise<TennisEnvelope<TennisMatchItem>> {
  return tennisRequest('POST', `/tennis/matches/${encodeURIComponent(matchId)}/publish`);
}
