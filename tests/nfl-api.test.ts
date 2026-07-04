import { describe, expect, it, vi, afterEach } from 'vitest';
import { ApiClientError } from '@/lib/api';
import { parseNflApiError } from '@/lib/nfl-api';
import { apiDelete } from '@/lib/api';
import { installFetch } from './helpers/mock-fetch';

describe('parseNflApiError', () => {
  it('extracts field messages from api-sports envelope', () => {
    const err = parseNflApiError(
      {
        get: 'teams',
        parameters: { league: '1' },
        errors: { parameters: 'The "season" parameter is required.' },
        results: 0,
        response: [],
      },
      400,
    );
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.message).toContain('season');
    expect(err.code).toBe('NFL_ERROR');
    expect(err.status).toBe(400);
  });

  it('falls back to generic message', () => {
    const err = parseNflApiError(null, 503);
    expect(err.message).toContain('503');
  });
});

describe('apiDelete with body', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends JSON body on DELETE', async () => {
    const fetchMock = installFetch([
      { match: '/nfl/seasons', status: 204, body: null, ok: true },
    ]);
    await apiDelete('/nfl/seasons', { year: 2024 });
    expect(fetchMock).toHaveBeenCalled();
    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    const init = call?.[1] as RequestInit | undefined;
    expect(init?.method).toBe('DELETE');
    expect(init?.body).toBe(JSON.stringify({ year: 2024 }));
  });
});
