import { afterEach, describe, expect, it } from 'vitest';
import { consumeCreatedMatch, stashCreatedMatch } from '@/lib/pending-created-match';
import type { Match } from '@/lib/types';

afterEach(() => sessionStorage.clear());

const match: Match = {
  id: 'api_new',
  externalId: null,
  sport: 'soccer',
  leagueId: 'lg_mx',
  seasonId: 'se25',
  date: '2026-07-01T20:00:00.000Z',
  status: 'NS',
  round: null,
  venue: null,
  home: { teamId: 't1', name: 'América', logo: null, score: null },
  away: { teamId: 't2', name: 'Chivas', logo: null, score: null },
  updatedAt: '2026-06-25T00:00:00.000Z',
};

describe('pending created match', () => {
  it('stores and consumes a created match once', () => {
    stashCreatedMatch(match);
    expect(consumeCreatedMatch()).toEqual({ match, seasonId: 'se25' });
    expect(consumeCreatedMatch()).toBeNull();
  });

  it('stores the target season id when provided', () => {
    stashCreatedMatch(match, 'se26');
    expect(consumeCreatedMatch()?.seasonId).toBe('se26');
  });
});
