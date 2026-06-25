import { afterEach, describe, expect, it, vi } from 'vitest';
import { patchMatch } from '@/lib/match-api';
import { installFetch, resource } from './helpers/mock-fetch';
import type { Match } from '@/lib/types';

afterEach(() => vi.unstubAllGlobals());

const updatedMatch: Match = {
  id: 'api_1',
  externalId: '100',
  sport: 'soccer',
  leagueId: 'lg_mx',
  seasonId: 'se25',
  date: '2026-07-01T20:00:00.000Z',
  status: 'FT',
  round: '1',
  venue: 'Azteca',
  home: { teamId: 't1', name: 'América', logo: null, score: 2 },
  away: { teamId: 't2', name: 'Chivas', logo: null, score: 1 },
  updatedAt: '2026-06-24T00:00:00.000Z',
};

describe('patchMatch', () => {
  it('calls PATCH /v1/leagues/{leagueId}/matches/{matchId} with the API body', async () => {
    const fetchMock = installFetch([
      {
        match: '/v1/leagues/262/matches/api_1',
        body: resource(updatedMatch),
      },
    ]);

    const result = await patchMatch('262', 'api_1', {
      status: 'FT',
      homeScore: 2,
      awayScore: 1,
    });

    expect(result).toEqual(updatedMatch);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/v1/leagues/262/matches/api_1');
    expect(init).toMatchObject({
      method: 'PATCH',
      cache: 'no-store',
      body: JSON.stringify({
        status: 'FT',
        home: { score: 2 },
        away: { score: 1 },
      }),
    });
    const headers = init?.headers as Headers;
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});
