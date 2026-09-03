import { describe, expect, it } from 'vitest';
import { parseTennisTab, tennisMatchDetailPath, tennisRoundDetailPath, tennisTabPath, tennisTournamentDetailPath } from '@/lib/tennis-paths';

describe('parseTennisTab', () => {
  it('defaults to contenido', () => {
    expect(parseTennisTab(undefined)).toBe('contenido');
    expect(parseTennisTab('unknown')).toBe('contenido');
  });

  it('accepts coverage and loader', () => {
    expect(parseTennisTab('coverage')).toBe('coverage');
    expect(parseTennisTab('loader')).toBe('loader');
  });
});

describe('tennis paths', () => {
  it('builds tab paths', () => {
    expect(tennisTabPath('contenido')).toBe('/tennis');
    expect(tennisTabPath('loader')).toBe('/tennis?tab=loader');
    expect(tennisTabPath('coverage')).toBe('/tennis?tab=coverage');
  });

  it('builds tournament detail path', () => {
    expect(tennisTournamentDetailPath('abc-123')).toBe('/tennis/tournaments/abc-123');
  });

  it('builds round detail path', () => {
    expect(tennisRoundDetailPath('round-1')).toBe('/tennis/rounds/round-1');
  });

  it('builds match detail path', () => {
    expect(tennisMatchDetailPath('match-1')).toBe('/tennis/matches/match-1');
  });
});
