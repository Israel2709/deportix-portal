import { describe, expect, it } from 'vitest';
import { AMERICAN_FOOTBALL_SPORT_LABEL, sportDisplayName, sportPath } from '@/lib/sports';

describe('sportPath', () => {
  it('routes american-football to /american-football', () => {
    expect(sportPath('american-football')).toBe('/american-football');
  });

  it('routes other sports to /deportes/{slug}', () => {
    expect(sportPath('soccer')).toBe('/deportes/soccer');
  });
});

describe('sportDisplayName', () => {
  it('uses Football americano for american-football slug even when API name is NFL', () => {
    expect(sportDisplayName('american-football', 'NFL')).toBe(AMERICAN_FOOTBALL_SPORT_LABEL);
  });
});
