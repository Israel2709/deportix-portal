import { apiDelete, apiGet, apiPatch, apiPost } from './api';
import type { CatalogCountry } from './catalog-types';
import type { ApiCollection, ApiResource } from './types';

function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value?.trim()) qs.set(key, value.trim());
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

/** List countries from the global Deportix catalog (`GET /v1/countries`). */
export async function getCatalogCountries(params?: {
  name?: string;
  code?: string;
}): Promise<CatalogCountry[]> {
  const res = await apiGet<ApiCollection<CatalogCountry>>(
    `/v1/countries${buildQuery({ ...params, pageSize: '250' })}`,
  );
  return res.data;
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
