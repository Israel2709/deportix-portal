import { ApiClientError, apiDelete, apiGet, apiPatch, apiPost } from './api';
import type { AmericanFootballEnvelope } from './american-football-bff-types';
import type { CatalogCountry, CatalogLeagueType } from './catalog-types';
import type { ApiCollection, ApiResource } from './types';

function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value?.trim()) qs.set(key, value.trim());
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

/** Legacy BFF paths — same Firestore `countries` catalog, pre-`/v1/countries` deployments. */
const LEGACY_COUNTRY_LIST_PATHS = ['/american-football/countries', '/nfl/countries'] as const;

async function listCatalogCountriesFromLegacyBff(
  params?: { name?: string; code?: string },
): Promise<CatalogCountry[]> {
  const query = buildQuery({ name: params?.name, code: params?.code });
  let lastError: unknown;

  for (const path of LEGACY_COUNTRY_LIST_PATHS) {
    try {
      const envelope = await apiGet<AmericanFootballEnvelope<CatalogCountry>>(`${path}${query}`);
      return envelope.response ?? [];
    } catch (err) {
      lastError = err;
      if (err instanceof ApiClientError && err.status === 404) continue;
      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new ApiClientError('No se encontró un endpoint de países.', 'NOT_FOUND', 404);
}

/** List countries from the global Deportix catalog (`GET /v1/countries`). */
export async function getCatalogCountries(params?: {
  name?: string;
  code?: string;
}): Promise<CatalogCountry[]> {
  try {
    const res = await apiGet<ApiCollection<CatalogCountry>>(
      `/v1/countries${buildQuery({ ...params, pageSize: '250' })}`,
    );
    return res.data ?? [];
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return listCatalogCountriesFromLegacyBff(params);
    }
    throw err;
  }
}

export async function createCatalogCountry(body: CatalogCountry): Promise<CatalogCountry> {
  const res = await apiPost<ApiResource<CatalogCountry>>('/v1/countries', body);
  return res.data;
}

export async function updateCatalogCountry(
  key: string,
  body: CatalogCountry,
): Promise<CatalogCountry> {
  const res = await apiPatch<ApiResource<CatalogCountry>>(
    `/v1/countries${buildQuery({ name: key })}`,
    body,
  );
  return res.data;
}

export async function deleteCatalogCountry(key: string): Promise<void> {
  await apiDelete(`/v1/countries${buildQuery({ name: key })}`);
}

/** List league types from the global Deportix catalog (`GET /v1/league-types`). */
export async function getCatalogLeagueTypes(): Promise<CatalogLeagueType[]> {
  const res = await apiGet<ApiCollection<CatalogLeagueType>>('/v1/league-types?pageSize=50');
  return res.data ?? [];
}
