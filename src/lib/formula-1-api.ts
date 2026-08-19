import { ApiClientError, apiDelete, apiGet, apiPatch, apiPost } from './api';
import type {
  Formula1CircuitCreate,
  Formula1CircuitItem,
  Formula1CompetitionCreate,
  Formula1CompetitionItem,
  Formula1DriverCreate,
  Formula1DriverItem,
  Formula1DriverRankingCreate,
  Formula1DriverRankingItem,
  Formula1Envelope,
  Formula1RaceCreate,
  Formula1RaceItem,
  Formula1RaceRankingCreate,
  Formula1RaceRankingItem,
  Formula1TeamCreate,
  Formula1TeamItem,
  Formula1TeamRankingCreate,
  Formula1TeamRankingItem,
} from './formula-1-bff-types';

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

export function parseFormula1ApiError(body: unknown, status: number): ApiClientError {
  if (body && typeof body === 'object' && 'errors' in body) {
    const errors = (body as Formula1Envelope<unknown>).errors;
    if (Array.isArray(errors) && errors.length === 0) {
      return new ApiClientError(`La solicitud falló (${status})`, 'FORMULA_1_ERROR', status);
    }
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const messages = Object.values(errors as Record<string, string>).filter(Boolean);
      if (messages.length > 0) {
        return new ApiClientError(messages.join(' · '), 'FORMULA_1_ERROR', status);
      }
    }
  }
  return new ApiClientError(`La solicitud falló (${status})`, 'FORMULA_1_ERROR', status);
}

async function formula1Request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<Formula1Envelope<T>> {
  if (method === 'GET') return apiGet<Formula1Envelope<T>>(path);
  if (method === 'POST') return apiPost<Formula1Envelope<T>>(path, body);
  if (method === 'PATCH') return apiPatch<Formula1Envelope<T>>(path, body);
  await apiDelete(path, body);
  return { get: '', parameters: [], errors: [], results: 0, response: [] };
}

// --- Seasons (read-only; years derived from races) ---

export async function getFormula1Seasons(): Promise<Formula1Envelope<number>> {
  return formula1Request('GET', '/formula-1/seasons');
}

// --- Competitions ---

export interface Formula1IdNameQuery {
  id?: string;
  name?: string;
  search?: string;
}

export async function getFormula1Competitions(
  query: Formula1IdNameQuery = {},
): Promise<Formula1Envelope<Formula1CompetitionItem>> {
  return formula1Request(
    'GET',
    `/formula-1/competitions${buildQuery(query as Record<string, string | number | undefined | null>)}`,
  );
}

export async function createFormula1Competition(
  body: Formula1CompetitionCreate,
): Promise<Formula1Envelope<Formula1CompetitionItem>> {
  return formula1Request('POST', '/formula-1/competitions', body);
}

export async function updateFormula1Competition(
  id: string,
  body: Formula1CompetitionCreate,
): Promise<Formula1Envelope<Formula1CompetitionItem>> {
  return formula1Request('PATCH', `/formula-1/competitions${buildQuery({ id })}`, body);
}

export async function deleteFormula1Competition(id: string): Promise<void> {
  await formula1Request('DELETE', `/formula-1/competitions${buildQuery({ id })}`);
}

// --- Circuits ---

export interface Formula1CircuitQuery extends Formula1IdNameQuery {
  country?: string;
}

export async function getFormula1Circuits(
  query: Formula1CircuitQuery = {},
): Promise<Formula1Envelope<Formula1CircuitItem>> {
  return formula1Request(
    'GET',
    `/formula-1/circuits${buildQuery(query as Record<string, string | number | undefined | null>)}`,
  );
}

export async function createFormula1Circuit(
  body: Formula1CircuitCreate,
): Promise<Formula1Envelope<Formula1CircuitItem>> {
  return formula1Request('POST', '/formula-1/circuits', body);
}

export async function updateFormula1Circuit(
  id: string,
  body: Formula1CircuitCreate,
): Promise<Formula1Envelope<Formula1CircuitItem>> {
  return formula1Request('PATCH', `/formula-1/circuits${buildQuery({ id })}`, body);
}

export async function deleteFormula1Circuit(id: string): Promise<void> {
  await formula1Request('DELETE', `/formula-1/circuits${buildQuery({ id })}`);
}

// --- Teams (constructors) ---

export async function getFormula1Teams(
  query: Formula1IdNameQuery = {},
): Promise<Formula1Envelope<Formula1TeamItem>> {
  return formula1Request(
    'GET',
    `/formula-1/teams${buildQuery(query as Record<string, string | number | undefined | null>)}`,
  );
}

export async function createFormula1Team(
  body: Formula1TeamCreate,
): Promise<Formula1Envelope<Formula1TeamItem>> {
  return formula1Request('POST', '/formula-1/teams', body);
}

export async function updateFormula1Team(
  id: string,
  body: Formula1TeamCreate,
): Promise<Formula1Envelope<Formula1TeamItem>> {
  return formula1Request('PATCH', `/formula-1/teams${buildQuery({ id })}`, body);
}

export async function deleteFormula1Team(id: string): Promise<void> {
  await formula1Request('DELETE', `/formula-1/teams${buildQuery({ id })}`);
}

// --- Drivers ---

export interface Formula1DriverQuery extends Formula1IdNameQuery {
  team?: string;
}

export async function getFormula1Drivers(
  query: Formula1DriverQuery = {},
): Promise<Formula1Envelope<Formula1DriverItem>> {
  return formula1Request(
    'GET',
    `/formula-1/drivers${buildQuery(query as Record<string, string | number | undefined | null>)}`,
  );
}

export async function createFormula1Driver(
  body: Formula1DriverCreate,
): Promise<Formula1Envelope<Formula1DriverItem>> {
  return formula1Request('POST', '/formula-1/drivers', body);
}

export async function updateFormula1Driver(
  id: string,
  body: Formula1DriverCreate,
): Promise<Formula1Envelope<Formula1DriverItem>> {
  return formula1Request('PATCH', `/formula-1/drivers${buildQuery({ id })}`, body);
}

export async function deleteFormula1Driver(id: string): Promise<void> {
  await formula1Request('DELETE', `/formula-1/drivers${buildQuery({ id })}`);
}

// --- Races ---

export interface Formula1RacesQuery {
  id?: string;
  season?: number | string;
  competition?: string;
  type?: string;
  date?: string;
}

export async function getFormula1Races(
  query: Formula1RacesQuery = {},
): Promise<Formula1Envelope<Formula1RaceItem>> {
  if (query.id != null && Object.keys(query).length === 1) {
    return formula1Request('GET', `/formula-1/races/${encodeURIComponent(query.id)}`);
  }
  return formula1Request(
    'GET',
    `/formula-1/races${buildQuery(query as Record<string, string | number | undefined | null>)}`,
  );
}

export async function getFormula1Race(raceId: string): Promise<Formula1Envelope<Formula1RaceItem>> {
  return getFormula1Races({ id: raceId });
}

export async function createFormula1Race(
  body: Formula1RaceCreate,
): Promise<Formula1Envelope<Formula1RaceItem>> {
  return formula1Request('POST', '/formula-1/races', body);
}

export async function updateFormula1Race(
  raceId: string,
  body: Partial<Formula1RaceCreate>,
): Promise<Formula1Envelope<Formula1RaceItem>> {
  return formula1Request('PATCH', `/formula-1/races/${encodeURIComponent(raceId)}`, body);
}

export async function deleteFormula1Race(raceId: string): Promise<void> {
  await formula1Request('DELETE', `/formula-1/races/${encodeURIComponent(raceId)}`);
}

// --- Rankings ---

export async function getFormula1DriverRankings(query: {
  season: number | string;
  driver?: string;
  team?: string;
}): Promise<Formula1Envelope<Formula1DriverRankingItem>> {
  return formula1Request('GET', `/formula-1/rankings/drivers${buildQuery(query)}`);
}

export async function createFormula1DriverRanking(
  body: Formula1DriverRankingCreate,
): Promise<Formula1Envelope<Formula1DriverRankingItem>> {
  return formula1Request('POST', '/formula-1/rankings/drivers', body);
}

export async function updateFormula1DriverRanking(
  id: string,
  body: Partial<Formula1DriverRankingCreate>,
): Promise<Formula1Envelope<Formula1DriverRankingItem>> {
  return formula1Request('PATCH', `/formula-1/rankings/drivers${buildQuery({ id })}`, body);
}

export async function deleteFormula1DriverRanking(id: string): Promise<void> {
  await formula1Request('DELETE', `/formula-1/rankings/drivers${buildQuery({ id })}`);
}

export async function getFormula1TeamRankings(query: {
  season: number | string;
  team?: string;
}): Promise<Formula1Envelope<Formula1TeamRankingItem>> {
  return formula1Request('GET', `/formula-1/rankings/teams${buildQuery(query)}`);
}

export async function createFormula1TeamRanking(
  body: Formula1TeamRankingCreate,
): Promise<Formula1Envelope<Formula1TeamRankingItem>> {
  return formula1Request('POST', '/formula-1/rankings/teams', body);
}

export async function updateFormula1TeamRanking(
  id: string,
  body: Partial<Formula1TeamRankingCreate>,
): Promise<Formula1Envelope<Formula1TeamRankingItem>> {
  return formula1Request('PATCH', `/formula-1/rankings/teams${buildQuery({ id })}`, body);
}

export async function deleteFormula1TeamRanking(id: string): Promise<void> {
  await formula1Request('DELETE', `/formula-1/rankings/teams${buildQuery({ id })}`);
}

export async function getFormula1RaceRankings(query: {
  race: string;
}): Promise<Formula1Envelope<Formula1RaceRankingItem>> {
  return formula1Request('GET', `/formula-1/rankings/races${buildQuery(query)}`);
}

export async function createFormula1RaceRanking(
  body: Formula1RaceRankingCreate,
): Promise<Formula1Envelope<Formula1RaceRankingItem>> {
  return formula1Request('POST', '/formula-1/rankings/races', body);
}

export async function updateFormula1RaceRanking(
  id: string,
  body: Partial<Formula1RaceRankingCreate>,
): Promise<Formula1Envelope<Formula1RaceRankingItem>> {
  return formula1Request('PATCH', `/formula-1/rankings/races${buildQuery({ id })}`, body);
}

export async function deleteFormula1RaceRanking(id: string): Promise<void> {
  await formula1Request('DELETE', `/formula-1/rankings/races${buildQuery({ id })}`);
}
