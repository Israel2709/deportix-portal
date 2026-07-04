import { describe, expect, it } from 'vitest';
import { sportPath } from '@/lib/sports';

describe('sportPath', () => {
  it('routes NFL to /nfl', () => {
    expect(sportPath('nfl')).toBe('/nfl');
  });

  it('routes other sports to /deportes/{slug}', () => {
    expect(sportPath('soccer')).toBe('/deportes/soccer');
  });
});
