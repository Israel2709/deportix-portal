import { describe, expect, it } from 'vitest';
import {
  AMERICAN_FOOTBALL_SPORT_LABEL,
  FORMULA_1_SPORT_LABEL,
  TENNIS_SPORT_LABEL,
  sportDisplayName,
  sportPath,
} from '@/lib/sports';

describe('sportPath', () => {
  it('routes american-football to /american-football', () => {
    expect(sportPath('american-football')).toBe('/american-football');
  });

  it('routes f1 to /formula-1', () => {
    expect(sportPath('f1')).toBe('/formula-1');
  });

  it('routes tennis to /tennis', () => {
    expect(sportPath('tennis')).toBe('/tennis');
  });

  it('routes other sports to /deportes/{slug}', () => {
    expect(sportPath('soccer')).toBe('/deportes/soccer');
  });
});

describe('sportDisplayName', () => {
  it('uses Football americano for american-football slug even when API name is NFL', () => {
    expect(sportDisplayName('american-football', 'NFL')).toBe(AMERICAN_FOOTBALL_SPORT_LABEL);
  });

  it('uses Formula 1 for f1 slug', () => {
    expect(sportDisplayName('f1', 'F1')).toBe(FORMULA_1_SPORT_LABEL);
  });

  it('uses Tenis for tennis slug', () => {
    expect(sportDisplayName('tennis', 'Tennis')).toBe(TENNIS_SPORT_LABEL);
  });
});
