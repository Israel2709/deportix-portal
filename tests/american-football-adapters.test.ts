import { describe, expect, it } from 'vitest';
import { americanFootballGameToMatch, americanFootballTeamToTeam } from '@/lib/american-football/adapters';
import type { AmericanFootballGameItem } from '@/lib/american-football-bff-types';

const game: AmericanFootballGameItem = {
  game: {
    id: 'g1',
    week: '1',
    stage: 'Regular Season',
    date: { timezone: 'UTC', date: '2026-09-01', time: '20:00', timestamp: 1788206400 },
    venue: { name: 'Stadium', city: 'Dallas' },
    status: { short: 'FT', long: 'Finished', timer: null },
  },
  league: {
    id: '1',
    name: 'NFL',
    season: 2026,
    logo: null,
    country: { name: 'USA', code: 'US', flag: null },
  },
  teams: {
    home: { id: 't1', name: 'Cowboys', logo: null },
    away: { id: 't2', name: 'Giants', logo: null },
  },
  scores: {
    home: { total: 24 },
    away: { total: 17 },
  },
};

describe('american-football adapters', () => {
  it('maps a BFF game to a portal Match', () => {
    const match = americanFootballGameToMatch(game, '1', 2026);

    expect(match.id).toBe('g1');
    expect(match.round).toBe('1');
    expect(match.home.name).toBe('Cowboys');
    expect(match.away.score).toBe(17);
    expect(match.leagueId).toBe('1');
  });

  it('maps a BFF team to a portal Team', () => {
    const team = americanFootballTeamToTeam({ id: 't1', name: 'Cowboys', logo: null }, '1');
    expect(team.id).toBe('t1');
    expect(team.sport).toBe('american-football');
    expect(team.leagueId).toBe('1');
  });
});
