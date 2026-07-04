import { describe, expect, it } from 'vitest';
import { nflLeaguePath, nflTabPath, parseNflTab } from '@/lib/nfl-paths';

describe('nfl-paths', () => {
  it('parses tab query values', () => {
    expect(parseNflTab(null)).toBe('coverage');
    expect(parseNflTab('loader')).toBe('loader');
    expect(parseNflTab('browse')).toBe('browse');
    expect(parseNflTab('unknown')).toBe('coverage');
  });

  it('builds tab paths', () => {
    expect(nflTabPath('coverage')).toBe('/nfl');
    expect(nflTabPath('loader')).toBe('/nfl?tab=loader');
    expect(nflTabPath('browse')).toBe('/nfl?tab=browse');
  });

  it('builds league browse paths', () => {
    expect(nflLeaguePath({ id: 'lg_nfl', externalId: '1' })).toBe('/nfl/leagues/1');
    expect(nflLeaguePath({ id: 'lg_nfl', externalId: null })).toBe('/nfl/leagues/lg_nfl');
  });
});
