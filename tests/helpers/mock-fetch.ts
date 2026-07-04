import { vi } from 'vitest';

export interface MockRoute {
  /** Substring of the request URL to match (list most-specific routes first). */
  match: string;
  status?: number;
  ok?: boolean;
  body: unknown;
  headers?: Record<string, string>;
}

/** Install a global.fetch mock that routes by URL substring. */
export function installFetch(routes: MockRoute[]) {
  const fn = vi.fn(async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    const route = routes.find((r) => url.includes(r.match));
    if (!route) throw new Error(`No mock route for ${url}`);
    const status = route.status ?? (route.ok === false ? 500 : 200);
    return {
      ok: route.ok ?? status < 400,
      status,
      text: async () => JSON.stringify(route.body),
      headers: {
        get: (key: string) => route.headers?.[key.toLowerCase()] ?? null,
      },
    } as unknown as Response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** A fetch that never resolves — used to assert the loading state. */
export function installPendingFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {})),
  );
}

export const collection = (data: unknown[], total = data.length) => ({
  data,
  meta: { apiVersion: 'v1', updatedAt: '2026-06-23T00:00:00.000Z', pagination: { page: 1, pageSize: 20, total } },
});

export const resource = (data: unknown) => ({
  data,
  meta: { apiVersion: 'v1', updatedAt: '2026-06-23T00:00:00.000Z' },
});

export const errorBody = (code: string, message: string) => ({
  error: { code, message, requestId: 'req_test' },
});
