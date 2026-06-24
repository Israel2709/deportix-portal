import { describe, expect, it, beforeEach } from 'vitest';
import {
  applyMatchOverrides,
  applyMatchPatch,
  draftToPatch,
  isDraftDirty,
  matchToDraft,
  readMatchOverrides,
  saveMatchOverride,
} from '@/lib/match-edits';
import { readLocalMatches, updateLocalMatch } from '@/lib/local-matches';
import type { Match } from '@/lib/types';

const baseMatch: Match = {
  id: 'api_1',
  externalId: '100',
  sport: 'soccer',
  leagueId: 'lg_mx',
  seasonId: 'se25',
  date: '2026-07-01T20:00:00.000Z',
  status: 'NS',
  round: '1',
  venue: 'Azteca',
  home: { teamId: 't1', name: 'América', logo: null, score: null },
  away: { teamId: 't2', name: 'Chivas', logo: null, score: null },
  updatedAt: null,
};

describe('match edits', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('applies score and status patches to a match', () => {
    const patched = applyMatchPatch(baseMatch, {
      status: 'FT',
      homeScore: 2,
      awayScore: 1,
    });

    expect(patched.status).toBe('FT');
    expect(patched.home.score).toBe(2);
    expect(patched.away.score).toBe(1);
  });

  it('persists overrides for API matches per league and season', () => {
    saveMatchOverride('lg_mx', 'se25', 'api_1', {
      status: 'FT',
      homeScore: 3,
      awayScore: 0,
    });

    expect(readMatchOverrides('lg_mx', 'se25').api_1).toEqual({
      status: 'FT',
      homeScore: 3,
      awayScore: 0,
    });
    expect(readMatchOverrides('lg_mx', 'se26')).toEqual({});
  });

  it('merges overrides when rendering API matches', () => {
    saveMatchOverride('lg_mx', 'se25', 'api_1', { status: 'FT', homeScore: 1, awayScore: 0 });
    const merged = applyMatchOverrides([baseMatch], readMatchOverrides('lg_mx', 'se25'));

    expect(merged[0]?.status).toBe('FT');
    expect(merged[0]?.home.score).toBe(1);
    expect(merged[0]?.away.score).toBe(0);
  });

  it('detects dirty drafts and converts them to patches', () => {
    const draft = matchToDraft(baseMatch);
    expect(isDraftDirty(baseMatch, draft)).toBe(false);

    const edited = { ...draft, status: 'FT', homeScore: '2', awayScore: '1' };
    expect(isDraftDirty(baseMatch, edited)).toBe(true);
    expect(draftToPatch(edited)).toEqual({
      status: 'FT',
      homeScore: 2,
      awayScore: 1,
    });
  });

  it('updates local matches in storage', () => {
    const localMatch = { ...baseMatch, id: 'local_abc' };
    localStorage.setItem(
      'deportix.localMatches.v1.lg_mx.se25',
      JSON.stringify([localMatch]),
    );

    updateLocalMatch('lg_mx', 'se25', 'local_abc', {
      status: 'FT',
      homeScore: 4,
      awayScore: 2,
    });

    const stored = readLocalMatches('lg_mx', 'se25')[0];
    expect(stored).toBeDefined();
    expect(stored!.status).toBe('FT');
    expect(stored!.home.score).toBe(4);
    expect(stored!.away.score).toBe(2);
  });
});
