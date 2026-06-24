import { describe, expect, it } from 'vitest';
import { sortMatchesByDateAsc } from '@/lib/match-sort';
import type { Match } from '@/lib/types';

const matches: Match[] = [
  {
    id: 'm2',
    externalId: null,
    sport: 'soccer',
    leagueId: 'lg',
    seasonId: 'se',
    date: '2026-03-10T20:00:00Z',
    status: 'FT',
    round: 'Clausura - 2',
    venue: null,
    home: { teamId: 't2', name: 'Monterrey', logo: null, score: 1 },
    away: { teamId: 't3', name: 'Tigres', logo: null, score: 0 },
    updatedAt: null,
  },
  {
    id: 'm1',
    externalId: null,
    sport: 'soccer',
    leagueId: 'lg',
    seasonId: 'se',
    date: '2026-02-01T18:00:00Z',
    status: 'NS',
    round: 'Apertura - 1',
    venue: null,
    home: { teamId: 't1', name: 'América', logo: null, score: null },
    away: { teamId: 't4', name: 'Chivas', logo: null, score: null },
    updatedAt: null,
  },
];

describe('sortMatchesByDateAsc', () => {
  it('sorts matches by date ascending', () => {
    expect(sortMatchesByDateAsc(matches).map((match) => match.id)).toEqual(['m1', 'm2']);
  });

  it('places matches without date at the end', () => {
    const withMissingDate = [...matches, { ...matches[0]!, id: 'm3', date: null }];
    expect(sortMatchesByDateAsc(withMissingDate).at(-1)?.id).toBe('m3');
  });
});
