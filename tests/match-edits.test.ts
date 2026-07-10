import { describe, expect, it, beforeEach } from 'vitest';
import {
  applyMatchOverrides,
  applyMatchPatch,
  draftToPatch,
  isDraftDirty,
  matchEditPatchToApiBody,
  matchToDraft,
  readMatchOverrides,
  saveMatchOverride,
} from '@/lib/match-edits';
import { readLocalMatches, updateLocalMatch } from '@/lib/local-matches';
import type { Match, Team } from '@/lib/types';

const teams: Team[] = [
  { id: 't1', externalId: null, sport: 'soccer', leagueId: 'lg_mx', name: 'América', code: null, country: null, logo: null, altName: null, altLogo: null, city: null, conference: null, division: null, venue: null, updatedAt: null },
  { id: 't2', externalId: null, sport: 'soccer', leagueId: 'lg_mx', name: 'Chivas', code: null, country: null, logo: null, altName: null, altLogo: null, city: null, conference: null, division: null, venue: null, updatedAt: null },
  { id: 't3', externalId: null, sport: 'soccer', leagueId: 'lg_mx', name: 'Tigres', code: null, country: null, logo: null, altName: null, altLogo: null, city: null, conference: null, division: null, venue: null, updatedAt: null },
];

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

  it('applies full patches to a match', () => {
    const patched = applyMatchPatch(
      baseMatch,
      {
        date: '2026-07-02T18:30:00.000Z',
        round: 'Clausura - 2',
        venue: 'Akron',
        seasonId: 'se26',
        status: 'FT',
        homeTeamId: 't3',
        awayTeamId: 't2',
        homeScore: 2,
        awayScore: 1,
      },
      teams,
    );

    expect(patched.date).toBe('2026-07-02T18:30:00.000Z');
    expect(patched.round).toBe('Clausura - 2');
    expect(patched.venue).toBe('Akron');
    expect(patched.seasonId).toBe('se26');
    expect(patched.status).toBe('FT');
    expect(patched.home.teamId).toBe('t3');
    expect(patched.home.name).toBe('Tigres');
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

    const edited = {
      ...draft,
      date: '2026-07-02T13:30',
      round: 'Clausura - 3',
      venue: 'BBVA',
      seasonId: 'se25',
      status: 'FT',
      homeTeamId: 't1',
      awayTeamId: 't2',
      homeScore: '2',
      awayScore: '1',
    };
    expect(isDraftDirty(baseMatch, edited)).toBe(true);
    expect(draftToPatch(edited)).toEqual({
      date: '2026-07-02T19:30:00.000Z',
      round: 'Clausura - 3',
      venue: 'BBVA',
      seasonId: 'se25',
      status: 'FT',
      homeTeamId: 't1',
      awayTeamId: 't2',
      homeScore: 2,
      awayScore: 1,
    });
  });

  it('rejects identical home and away teams', () => {
    const draft = matchToDraft(baseMatch);
    expect(draftToPatch({ ...draft, awayTeamId: draft.homeTeamId })).toBe(
      'Local y visitante deben ser equipos distintos.',
    );
  });

  it('maps edit patches to the API PATCH body', () => {
    expect(
      matchEditPatchToApiBody({
        date: '2026-07-02T18:30:00.000Z',
        round: 'Clausura - 2',
        venue: 'Akron',
        seasonId: 'se25',
        status: 'FT',
        homeTeamId: 't1',
        awayTeamId: 't2',
        homeScore: 2,
        awayScore: 1,
      }),
    ).toEqual({
      date: '2026-07-02T18:30:00.000Z',
      round: 'Clausura - 2',
      venue: 'Akron',
      seasonId: 'se25',
      status: 'FT',
      home: { teamId: 't1', score: 2 },
      away: { teamId: 't2', score: 1 },
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
    }, teams);

    const stored = readLocalMatches('lg_mx', 'se25')[0];
    expect(stored).toBeDefined();
    expect(stored!.status).toBe('FT');
    expect(stored!.home.score).toBe(4);
    expect(stored!.away.score).toBe(2);
  });
});
