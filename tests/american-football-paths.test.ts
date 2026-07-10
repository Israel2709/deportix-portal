import { describe, expect, it } from 'vitest';
import { americanFootballLeaguePath, americanFootballTabPath, parseAmericanFootballTab } from '@/lib/american-football-paths';

describe('american-football-paths', () => {
  it('parses tab query values', () => {
    expect(parseAmericanFootballTab(null)).toBe('contenido');
    expect(parseAmericanFootballTab('loader')).toBe('loader');
    expect(parseAmericanFootballTab('browse')).toBe('browse');
    expect(parseAmericanFootballTab('coverage')).toBe('coverage');
    expect(parseAmericanFootballTab('unknown')).toBe('contenido');
  });

  it('builds tab paths', () => {
    expect(americanFootballTabPath('contenido')).toBe('/american-football');
    expect(americanFootballTabPath('coverage')).toBe('/american-football?tab=coverage');
    expect(americanFootballTabPath('loader')).toBe('/american-football?tab=loader');
    expect(americanFootballTabPath('browse')).toBe('/american-football?tab=browse');
  });

  it('builds league browse paths', () => {
    expect(americanFootballLeaguePath({ id: 'lg_nfl', externalId: '1' })).toBe('/american-football/leagues/lg_nfl');
    expect(americanFootballLeaguePath({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', externalId: null })).toBe(
      '/american-football/leagues/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
  });
});
