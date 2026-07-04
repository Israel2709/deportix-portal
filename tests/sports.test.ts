import { describe, expect, it } from 'vitest';
import { sportPath } from '@/lib/sports';

describe('sportPath', () => {
  it('routes american-football to /american-football', () => {
    expect(sportPath('american-football')).toBe('/american-football');
  });

  it('routes other sports to /deportes/{slug}', () => {
    expect(sportPath('soccer')).toBe('/deportes/soccer');
  });
});
