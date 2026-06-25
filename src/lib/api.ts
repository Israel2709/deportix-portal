import type { ApiErrorBody } from './types';

/**
 * Thin client for the public Deportix API. The portal talks ONLY to this base URL and
 * never to Firebase. The base URL is a build-time public env var.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;

  constructor(message: string, code: string, status: number, requestId?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface RawResponse {
  status: number;
  ok: boolean;
  durationMs: number;
  headers: Record<string, string>;
  body: unknown;
}

const SAFE_HEADERS = [
  'content-type',
  'cache-control',
  'etag',
  'x-request-id',
  'access-control-allow-origin',
];

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** Bypass browser/CDN caches so ETag revalidation cannot return stale 304 responses. */
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (res.status !== 304) return res;

  // Belt-and-suspenders: retry once if a cache still returns 304 with an empty body.
  return fetch(apiUrl(path), {
    ...init,
    headers,
    cache: 'reload',
  });
}

async function readJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function throwApiError(res: Response, body: unknown): never {
  const errorBody = body as ApiErrorBody | null;
  throw new ApiClientError(
    errorBody?.error?.message ?? `La solicitud falló (${res.status})`,
    errorBody?.error?.code ?? 'HTTP_ERROR',
    res.status,
    errorBody?.error?.requestId,
  );
}

/**
 * Low-level request used by the API Explorer. Never throws on HTTP errors — returns status,
 * timing, a curated set of non-sensitive headers, and the parsed body so the UI can display
 * everything (including error envelopes).
 */
export async function rawRequest(path: string): Promise<RawResponse> {
  const start = now();
  const res = await apiFetch(path);
  const durationMs = Math.round(now() - start);
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  const headers: Record<string, string> = {};
  for (const key of SAFE_HEADERS) {
    const value = res.headers.get(key);
    if (value) headers[key] = value;
  }
  return { status: res.status, ok: res.ok, durationMs, headers, body };
}

/** Typed GET that throws an ApiClientError on a non-2xx response. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  const body = await readJsonResponse(res);
  if (!res.ok) throwApiError(res, body);
  return body as T;
}

/** Typed PATCH that throws an ApiClientError on a non-2xx response. */
export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const parsed = await readJsonResponse(res);
  if (!res.ok) throwApiError(res, parsed);
  return parsed as T;
}

/** Endpoints the API Explorer is allowed to call (no arbitrary URLs). */
export interface ExplorerEndpoint {
  id: string;
  label: string;
  method: 'GET';
  /** Path template with `{param}` placeholders. */
  template: string;
  params: { name: string; in: 'path' | 'query'; required?: boolean; placeholder?: string }[];
}

export const EXPLORER_ENDPOINTS: ExplorerEndpoint[] = [
  { id: 'health', label: 'GET /v1/health', method: 'GET', template: '/v1/health', params: [] },
  {
    id: 'data-status',
    label: 'GET /v1/data-status',
    method: 'GET',
    template: '/v1/data-status',
    params: [],
  },
  { id: 'sports', label: 'GET /v1/sports', method: 'GET', template: '/v1/sports', params: [] },
  {
    id: 'leagues',
    label: 'GET /v1/leagues',
    method: 'GET',
    template: '/v1/leagues',
    params: [
      { name: 'sport', in: 'query', placeholder: 'soccer' },
      { name: 'page', in: 'query', placeholder: '1' },
      { name: 'pageSize', in: 'query', placeholder: '20' },
    ],
  },
  {
    id: 'league',
    label: 'GET /v1/leagues/{leagueId}',
    method: 'GET',
    template: '/v1/leagues/{leagueId}',
    params: [{ name: 'leagueId', in: 'path', required: true, placeholder: '262' }],
  },
  {
    id: 'league-seasons',
    label: 'GET /v1/leagues/{leagueId}/seasons',
    method: 'GET',
    template: '/v1/leagues/{leagueId}/seasons',
    params: [{ name: 'leagueId', in: 'path', required: true, placeholder: '262' }],
  },
  {
    id: 'league-teams',
    label: 'GET /v1/leagues/{leagueId}/teams',
    method: 'GET',
    template: '/v1/leagues/{leagueId}/teams',
    params: [
      { name: 'leagueId', in: 'path', required: true, placeholder: '128' },
      { name: 'pageSize', in: 'query', placeholder: '20' },
    ],
  },
  {
    id: 'league-standings',
    label: 'GET /v1/leagues/{leagueId}/standings',
    method: 'GET',
    template: '/v1/leagues/{leagueId}/standings',
    params: [
      { name: 'leagueId', in: 'path', required: true, placeholder: '128' },
      { name: 'season', in: 'query', placeholder: '2026' },
    ],
  },
  {
    id: 'league-matches',
    label: 'GET /v1/leagues/{leagueId}/matches',
    method: 'GET',
    template: '/v1/leagues/{leagueId}/matches',
    params: [
      { name: 'leagueId', in: 'path', required: true, placeholder: '128' },
      { name: 'season', in: 'query', placeholder: '2026' },
      { name: 'status', in: 'query', placeholder: 'NS' },
      { name: 'pageSize', in: 'query', placeholder: '20' },
    ],
  },
  {
    id: 'team',
    label: 'GET /v1/teams/{teamId}',
    method: 'GET',
    template: '/v1/teams/{teamId}',
    params: [{ name: 'teamId', in: 'path', required: true, placeholder: 'team-id' }],
  },
];

/** Build a concrete path from an endpoint template + user-provided values. */
export function buildPath(
  endpoint: ExplorerEndpoint,
  values: Record<string, string>,
): string {
  let path = endpoint.template;
  const query = new URLSearchParams();
  for (const param of endpoint.params) {
    const value = (values[param.name] ?? '').trim();
    if (param.in === 'path') {
      path = path.replace(`{${param.name}}`, encodeURIComponent(value || ''));
    } else if (value) {
      query.set(param.name, value);
    }
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}
